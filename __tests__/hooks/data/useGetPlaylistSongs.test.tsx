/**
 * @jest-environment jsdom
 */
import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import useGetPlaylistSongs from "@/hooks/data/useGetPlaylistSongs";
import * as useNetworkStatusModule from "@/hooks/utils/useNetworkStatus";

// window.electron のモック（テスト開始前に設定）
const mockGetOfflineSimulationStatus = jest.fn(() =>
  Promise.resolve({ isOffline: false })
);
const mockSyncPlaylistSongs = jest.fn(() => Promise.resolve({ success: true }));
const mockGetCachedPlaylistSongs = jest.fn(() =>
  Promise.resolve([
    {
      id: "cached-song-1",
      title: "Cached Song 1",
      author: "Cached Author",
      song_path: "cached/path.mp3",
      image_path: "cached/image.jpg",
    },
  ])
);

Object.defineProperty(window, "electron", {
  value: {
    dev: {
      getOfflineSimulationStatus: mockGetOfflineSimulationStatus,
    },
    ipc: {
      on: jest.fn(() => () => {}),
    },
    cache: {
      syncPlaylistSongs: mockSyncPlaylistSongs,
      getCachedPlaylistSongs: mockGetCachedPlaylistSongs,
    },
    appInfo: {
      isElectron: true,
    },
  },
  writable: true,
  configurable: true,
});

// Supabase モック
jest.mock("@/libs/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () =>
            Promise.resolve({
              data: [
                {
                  id: 1,
                  songs: {
                    id: "song-1",
                    title: "Test Song 1",
                    author: "Author 1",
                    song_path: "path/to/song1.mp3",
                    image_path: "path/to/image1.jpg",
                  },
                },
                {
                  id: 2,
                  songs: {
                    id: "song-2",
                    title: "Test Song 2",
                    author: "Author 2",
                    song_path: "path/to/song2.mp3",
                    image_path: "path/to/image2.jpg",
                  },
                },
              ],
              error: null,
            }),
        }),
      }),
    }),
  }),
}));

jest.mock("@/hooks/utils/useNetworkStatus");

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

describe("useGetPlaylistSongs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetOfflineSimulationStatus.mockResolvedValue({ isOffline: false });
  });

  describe("オンライン時", () => {
    beforeEach(() => {
      (useNetworkStatusModule.useNetworkStatus as jest.Mock).mockReturnValue({
        isOnline: true,
        isInitialized: true,
        wasOffline: false,
      });
    });

    it("Supabaseからプレイリストの曲を取得する", async () => {
      const { result } = renderHook(() => useGetPlaylistSongs("playlist-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.songs).toHaveLength(2);
      expect(result.current.songs[0].title).toBe("Test Song 1");
    });

    it("取得した曲をSQLiteにキャッシュする", async () => {
      const { result } = renderHook(() => useGetPlaylistSongs("playlist-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockSyncPlaylistSongs).toHaveBeenCalledWith({
        playlistId: "playlist-123",
        songs: expect.arrayContaining([
          expect.objectContaining({ id: "song-1", title: "Test Song 1" }),
          expect.objectContaining({ id: "song-2", title: "Test Song 2" }),
        ]),
      });
    });
  });

  describe("オフライン時", () => {
    beforeEach(() => {
      (useNetworkStatusModule.useNetworkStatus as jest.Mock).mockReturnValue({
        isOnline: false,
        isInitialized: true,
        wasOffline: true,
      });
      mockGetOfflineSimulationStatus.mockResolvedValue({ isOffline: true });
    });

    it("SQLiteキャッシュからプレイリストの曲を取得する", async () => {
      const { result } = renderHook(() => useGetPlaylistSongs("playlist-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockGetCachedPlaylistSongs).toHaveBeenCalledWith("playlist-123");
      expect(result.current.songs).toHaveLength(1);
      expect(result.current.songs[0].title).toBe("Cached Song 1");
    });
  });
});
