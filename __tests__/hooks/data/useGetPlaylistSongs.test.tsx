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
import useGetPlaylistSongs from "@/hooks/data/useGetPlaylistSongs";
import { electronAPI } from "@/libs/electron-utils";

// electronAPI のモック
jest.mock("@/libs/electron-utils", () => ({
  electronAPI: {
    isElectron: jest.fn(),
    cache: {
      getCachedPlaylistSongs: jest.fn(),
      syncPlaylistSongs: jest.fn(),
    },
  },
}));

// Supabase モック
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

describe("useGetPlaylistSongs", () => {
  const mockIsElectron = electronAPI.isElectron as jest.Mock;
  const mockGetCachedPlaylistSongs = electronAPI.cache
    .getCachedPlaylistSongs as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    act(() => {
      onlineManager.setOnline(true);
    });
  });

  describe("Electron環境（ローカルファースト）", () => {
    beforeEach(() => {
      mockIsElectron.mockReturnValue(true);
    });

    it("オンライン時もローカルDBからプレイリスト曲を取得する", async () => {
      const mockCachedSongs = [
        { id: "song-1", title: "Cached Song 1", author: "Artist 1" },
        { id: "song-2", title: "Cached Song 2", author: "Artist 2" },
      ];
      mockGetCachedPlaylistSongs.mockResolvedValue(mockCachedSongs);

      const { result } = renderHook(() => useGetPlaylistSongs("playlist-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(
        () => {
          expect(result.current.isLoading).toBe(false);
          expect(result.current.songs).toHaveLength(2);
        },
        { timeout: 5000 }
      );

      expect(mockGetCachedPlaylistSongs).toHaveBeenCalledWith("playlist-123");
      // APIは呼ばれない
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it("オフライン時もローカルDBからプレイリスト曲を取得する", async () => {
      act(() => {
        onlineManager.setOnline(false);
      });

      const mockCachedSongs = [
        { id: "cached-song-1", title: "Cached Song", author: "Artist" },
      ];
      mockGetCachedPlaylistSongs.mockResolvedValue(mockCachedSongs);

      const { result } = renderHook(() => useGetPlaylistSongs("playlist-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(
        () => {
          expect(result.current.isLoading).toBe(false);
          expect(result.current.songs).toHaveLength(1);
        },
        { timeout: 5000 }
      );

      expect(mockGetCachedPlaylistSongs).toHaveBeenCalledWith("playlist-123");
    });
  });

  describe("Web環境（非Electron）", () => {
    beforeEach(() => {
      mockIsElectron.mockReturnValue(false);
    });

    it("Supabaseからプレイリスト曲を取得する", async () => {
      const mockSongsData = [
        {
          id: 1,
          songs: { id: "song-1", title: "Test Song 1", author: "Author 1" },
        },
        {
          id: 2,
          songs: { id: "song-2", title: "Test Song 2", author: "Author 2" },
        },
      ];

      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest
          .fn()
          .mockResolvedValue({ data: mockSongsData, error: null }),
      });

      const { result } = renderHook(() => useGetPlaylistSongs("playlist-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(
        () => {
          expect(result.current.isLoading).toBe(false);
          expect(result.current.songs).toHaveLength(2);
        },
        { timeout: 5000 }
      );

      expect(result.current.songs[0].title).toBe("Test Song 1");
      // ローカルDBは呼ばれない
      expect(mockGetCachedPlaylistSongs).not.toHaveBeenCalled();
    });
  });
});
