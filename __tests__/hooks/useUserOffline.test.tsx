/**
 * @fileoverview オフラインでのログイン状態維持機能のテスト
 *
 * テストシナリオ:
 * 1. オンラインでログイン → ユーザー情報がキャッシュされる
 * 2. オフラインでアプリ起動 → キャッシュからユーザー情報を復元
 * 3. ログアウト → キャッシュがクリアされる
 */

import React from "react";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MyUserContextProvider, useUser } from "@/hooks/auth/useUser";

// モック用の変数
let mockIsOnline = true;
let mockIsInitialized = true;
let mockCachedUser: { id: string; email?: string; avatarUrl?: string } | null =
  null;
let mockSession: { user: any; access_token: string } | null = null;
let authStateChangeCallback: ((event: string, session: any) => void) | null =
  null;

// useNetworkStatus のモック
jest.mock("@/hooks/utils/useNetworkStatus", () => ({
  useNetworkStatus: () => ({
    isOnline: mockIsOnline,
    wasOffline: false,
    isInitialized: mockIsInitialized,
  }),
}));

// Supabase クライアントのモック
jest.mock("@/libs/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getSession: jest.fn().mockImplementation(async () => ({
        data: { session: mockSession },
      })),
      onAuthStateChange: jest.fn().mockImplementation((callback) => {
        authStateChangeCallback = callback;
        return {
          data: {
            subscription: {
              unsubscribe: jest.fn(),
            },
          },
        };
      }),
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: { id: "test-user-id", full_name: "Test User" },
          error: null,
        }),
      }),
    }),
  }),
}));

// electronAPI のモック
jest.mock("@/libs/electron-utils", () => ({
  electronAPI: {
    isElectron: jest.fn().mockReturnValue(true),
    auth: {
      saveCachedUser: jest.fn().mockImplementation(async (user) => {
        mockCachedUser = user;
        return { success: true };
      }),
      getCachedUser: jest.fn().mockImplementation(async () => {
        return mockCachedUser;
      }),
      clearCachedUser: jest.fn().mockImplementation(async () => {
        mockCachedUser = null;
        return { success: true };
      }),
    },
  },
}));

// テスト用のラッパー
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MyUserContextProvider>{children}</MyUserContextProvider>
    </QueryClientProvider>
  );
};

describe("useUser - オフラインログイン状態維持", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsOnline = true;
    mockIsInitialized = true;
    mockCachedUser = null;
    mockSession = null;
    authStateChangeCallback = null;
  });

  describe("オンライン時の動作", () => {
    it("ログイン時にユーザー情報がキャッシュされる", async () => {
      const { electronAPI } = require("@/libs/electron-utils");

      // オンラインでセッションがある状態
      mockSession = {
        user: {
          id: "user-123",
          email: "test@example.com",
          user_metadata: { avatar_url: "https://example.com/avatar.png" },
        },
        access_token: "test-token",
      };

      const { result } = renderHook(() => useUser(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // ユーザー情報がセットされている
      expect(result.current.user).toBeTruthy();
      expect(result.current.user?.id).toBe("user-123");

      // キャッシュに保存されている
      expect(electronAPI.auth.saveCachedUser).toHaveBeenCalledWith({
        id: "user-123",
        email: "test@example.com",
        avatarUrl: "https://example.com/avatar.png",
      });
    });

    it("ログアウト時にキャッシュがクリアされる", async () => {
      const { electronAPI } = require("@/libs/electron-utils");

      // 最初はログイン状態
      mockSession = {
        user: {
          id: "user-123",
          email: "test@example.com",
          user_metadata: {},
        },
        access_token: "test-token",
      };

      renderHook(() => useUser(), {
        wrapper: createWrapper(),
      });

      // authStateChange でログアウトをシミュレート
      await waitFor(() => {
        expect(authStateChangeCallback).not.toBeNull();
      });

      // ログアウトイベントを発火
      act(() => {
        authStateChangeCallback?.("SIGNED_OUT", null);
      });

      // キャッシュがクリアされる
      expect(electronAPI.auth.clearCachedUser).toHaveBeenCalled();
    });
  });

  describe("オフライン時の動作", () => {
    it("オフラインでアプリ起動時、キャッシュからユーザー情報を復元できる", async () => {
      const { electronAPI } = require("@/libs/electron-utils");

      // オフライン状態を設定
      mockIsOnline = false;

      // 事前にキャッシュされたユーザー情報
      mockCachedUser = {
        id: "cached-user-456",
        email: "cached@example.com",
        avatarUrl: "https://example.com/cached-avatar.png",
      };

      const { result } = renderHook(() => useUser(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // キャッシュからユーザー情報が復元されている
      expect(result.current.user).toBeTruthy();
      expect(result.current.user?.id).toBe("cached-user-456");
      expect(result.current.user?.email).toBe("cached@example.com");
      expect(result.current.user?.user_metadata?.avatar_url).toBe(
        "https://example.com/cached-avatar.png"
      );

      // getCachedUser が呼ばれている
      expect(electronAPI.auth.getCachedUser).toHaveBeenCalled();
    });

    it("オフラインでキャッシュがない場合、ユーザーはnullのまま", async () => {
      // オフライン状態を設定
      mockIsOnline = false;

      // キャッシュなし
      mockCachedUser = null;

      const { result } = renderHook(() => useUser(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // ユーザーはnull
      expect(result.current.user).toBeNull();
    });

    it("オフラインで復元されたユーザーにはアクセストークンがない", async () => {
      // オフライン状態を設定
      mockIsOnline = false;

      // 事前にキャッシュされたユーザー情報
      mockCachedUser = {
        id: "cached-user-789",
        email: "offline@example.com",
      };

      const { result } = renderHook(() => useUser(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // ユーザーは復元されているが、アクセストークンはない（セッションなし）
      expect(result.current.user).toBeTruthy();
      expect(result.current.accessToken).toBeNull();
    });
  });

  describe("初期化待機", () => {
    it("初期化が完了するまでセッションの取得を待つ", async () => {
      // 初期化未完了状態
      mockIsInitialized = false;

      const { result } = renderHook(() => useUser(), {
        wrapper: createWrapper(),
      });

      // isLoading は true のまま（初期化待ち）
      expect(result.current.isLoading).toBe(true);
    });
  });
});
