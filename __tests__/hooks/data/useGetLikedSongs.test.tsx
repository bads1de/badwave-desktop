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
import useGetLikedSongs from "@/hooks/data/useGetLikedSongs";
import { electronAPI } from "@/libs/electron/index";

// electronAPI のモック
jest.mock("@/libs/electron/index", () => ({
  electronAPI: {
    isElectron: jest.fn(),
    cache: {
      getCachedLikedSongs: jest.fn(),
      syncLikedSongs: jest.fn(),
    },
  },
}));

// Supabaseのモック
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

describe("useGetLikedSongs", () => {
  const mockIsElectron = electronAPI.isElectron as jest.Mock;
  const mockGetCachedLikedSongs = electronAPI.cache
    .getCachedLikedSongs as jest.Mock;

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

    it("オンライン時もローカルDBからいいねした曲を取得する", async () => {
      const mockCachedSongs = [
        { id: "s1", title: "Liked Song 1", author: "Artist 1" },
      ];
      mockGetCachedLikedSongs.mockResolvedValue(mockCachedSongs);

      const { result } = renderHook(() => useGetLikedSongs("user-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.likedSongs).toEqual(mockCachedSongs);
      expect(mockGetCachedLikedSongs).toHaveBeenCalledWith("user-1");
      // APIは呼ばれない
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it("オフライン時もローカルDBからいいねした曲を取得する", async () => {
      act(() => {
        onlineManager.setOnline(false);
      });

      const mockCachedSongs = [
        { id: "s-cached", title: "Cached Liked Song", author: "Artist 1" },
      ];
      mockGetCachedLikedSongs.mockResolvedValue(mockCachedSongs);

      const { result } = renderHook(() => useGetLikedSongs("user-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.likedSongs).toEqual(mockCachedSongs);
      expect(mockGetCachedLikedSongs).toHaveBeenCalledWith("user-1");
    });
  });

  describe("Web環境（非Electron）", () => {
    beforeEach(() => {
      mockIsElectron.mockReturnValue(false);
    });

    it("Supabaseからいいねした曲を取得する", async () => {
      const mockSongs = [
        {
          id: "s1",
          songs: { id: "s1", title: "Liked Song 1", author: "Artist 1" },
        },
      ];

      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockSongs, error: null }),
      });

      const { result } = renderHook(() => useGetLikedSongs("user-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.likedSongs).toHaveLength(1);
      expect(result.current.likedSongs[0].title).toBe("Liked Song 1");
      // ローカルDBは呼ばれない
      expect(mockGetCachedLikedSongs).not.toHaveBeenCalled();
    });
  });
});
