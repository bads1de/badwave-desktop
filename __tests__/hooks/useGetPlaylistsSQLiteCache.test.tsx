import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import useGetPlaylists from "@/hooks/data/useGetPlaylists";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";
import { electronAPI } from "@/libs/electron-utils";
import React from "react";

// モックの設定
jest.mock("@/hooks/utils/useNetworkStatus");
jest.mock("@/libs/electron-utils");
jest.mock("@/hooks/auth/useUser", () => ({
  useUser: () => ({ user: { id: "test-user-id" } }),
}));

// Supabaseクライアントのモック
const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest
    .fn()
    .mockImplementation(() => Promise.resolve({ data: [], error: null })),
};

jest.mock("@/libs/supabase/client", () => ({
  createClient: jest.fn(() => mockSupabase),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useGetPlaylists (SQLite Cache Support)", () => {
  const mockUseNetworkStatus = useNetworkStatus as jest.Mock;
  const mockElectronAPI = electronAPI as jest.Mocked<typeof electronAPI>;

  const mockPlaylists = [
    {
      id: "playlist-1",
      user_id: "test-user-id",
      title: "My Favorites",
      image_path: null,
      is_public: false,
      created_at: "2024-01-01T00:00:00Z",
    },
    {
      id: "playlist-2",
      user_id: "test-user-id",
      title: "Workout Mix",
      image_path: null,
      is_public: true,
      created_at: "2024-01-02T00:00:00Z",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // electronAPI のモック設定
    mockElectronAPI.isElectron = jest.fn().mockReturnValue(true);
    mockElectronAPI.cache = {
      syncPlaylists: jest.fn().mockResolvedValue({ success: true, count: 2 }),
      getCachedPlaylists: jest.fn().mockResolvedValue(mockPlaylists),
      syncSongsMetadata: jest
        .fn()
        .mockResolvedValue({ success: true, count: 0 }),
      syncPlaylistSongs: jest
        .fn()
        .mockResolvedValue({ success: true, count: 0 }),
      syncLikedSongs: jest.fn().mockResolvedValue({ success: true, count: 0 }),
      getCachedLikedSongs: jest.fn().mockResolvedValue([]),
      getCachedPlaylistSongs: jest.fn().mockResolvedValue([]),
    };

    mockElectronAPI.store = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(true),
    };
  });

  describe("オンライン時の動作", () => {
    beforeEach(() => {
      mockUseNetworkStatus.mockReturnValue({ isOnline: true });
    });

    it("APIからプレイリストを取得し、SQLiteキャッシュに保存する", async () => {
      mockSupabase.order.mockResolvedValue({
        data: mockPlaylists,
        error: null,
      });

      const { result } = renderHook(() => useGetPlaylists(), {
        wrapper: createWrapper(),
      });

      await waitFor(
        () => {
          expect(result.current.playlists).toHaveLength(2);
        },
        { timeout: 10000 }
      );

      // SQLiteキャッシュに保存が呼ばれたことを確認
      await waitFor(
        () => {
          expect(mockElectronAPI.cache.syncPlaylists).toHaveBeenCalledWith(
            mockPlaylists
          );
        },
        { timeout: 10000 }
      );
    });
  });
});