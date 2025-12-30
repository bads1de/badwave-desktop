/**
 * @jest-environment jsdom
 */
import React from "react";
import { renderHook, waitFor, act } from "@testing-library/react";
import {
  QueryClient,
  QueryClientProvider,
  onlineManager,
} from "@tanstack/react-query";
import useGetPlaylists from "@/hooks/data/useGetPlaylists";
import { useUser } from "@/hooks/auth/useUser";
import { electronAPI } from "@/libs/electron/index";

// モック
jest.mock("@/hooks/auth/useUser");
jest.mock("@/libs/electron/index", () => ({
  electronAPI: {
    isElectron: jest.fn(),
    cache: {
      getCachedPlaylists: jest.fn(),
      syncPlaylists: jest.fn(),
    },
  },
}));

const mockFrom = jest.fn();
jest.mock("@/libs/supabase/client", () => ({
  createClient: () => ({
    from: mockFrom,
  }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useGetPlaylists", () => {
  const mockIsElectron = electronAPI.isElectron as jest.Mock;
  const mockGetCachedPlaylists = electronAPI.cache
    .getCachedPlaylists as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    (useUser as jest.Mock).mockReturnValue({ user: { id: "user-1" } });
    act(() => {
      onlineManager.setOnline(true);
    });
  });

  describe("Electron環境（ローカルファースト）", () => {
    beforeEach(() => {
      mockIsElectron.mockReturnValue(true);
    });

    it("オンライン時もローカルDBからプレイリストを取得する", async () => {
      const mockCachedPlaylists = [
        { id: "p1", title: "Playlist 1", user_id: "user-1" },
      ];
      mockGetCachedPlaylists.mockResolvedValue(mockCachedPlaylists);

      const { result } = renderHook(() => useGetPlaylists(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.playlists).toEqual(mockCachedPlaylists);
      expect(mockGetCachedPlaylists).toHaveBeenCalledWith("user-1");
      // APIは呼ばれない
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it("オフライン時もローカルDBからプレイリストを取得する", async () => {
      act(() => {
        onlineManager.setOnline(false);
      });

      const mockCachedPlaylists = [
        { id: "p-cached", title: "Cached Playlist", user_id: "user-1" },
      ];
      mockGetCachedPlaylists.mockResolvedValue(mockCachedPlaylists);

      const { result } = renderHook(() => useGetPlaylists(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.playlists).toEqual(mockCachedPlaylists);
      expect(mockGetCachedPlaylists).toHaveBeenCalledWith("user-1");
    });
  });

  describe("Web環境（非Electron）", () => {
    beforeEach(() => {
      mockIsElectron.mockReturnValue(false);
    });

    it("Supabaseからプレイリストを取得する", async () => {
      const mockPlaylists = [
        { id: "p1", title: "Playlist 1", user_id: "user-1" },
      ];

      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest
          .fn()
          .mockResolvedValue({ data: mockPlaylists, error: null }),
      });

      const { result } = renderHook(() => useGetPlaylists(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.playlists).toEqual(mockPlaylists);
      // ローカルDBは呼ばれない
      expect(mockGetCachedPlaylists).not.toHaveBeenCalled();
    });
  });
});
