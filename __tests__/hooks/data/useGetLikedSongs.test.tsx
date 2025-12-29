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

// モック
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
  beforeEach(() => {
    jest.clearAllMocks();
    act(() => {
      onlineManager.setOnline(true);
    });
  });

  describe("オンライン時", () => {
    it("Supabaseからいいねした曲を取得し、キャッシュに同期する", async () => {
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
      expect(window.electron.cache.syncLikedSongs).toHaveBeenCalledWith({
        userId: "user-1",
        songs: expect.any(Array),
      });
    });
  });

  describe("オフライン時", () => {
    it("SQLiteキャッシュからいいねした曲を取得する", async () => {
      act(() => {
        onlineManager.setOnline(false);
      });

      const mockCachedSongs = [
        { id: "s-cached", title: "Cached Liked Song", author: "Artist 1" },
      ];
      (window.electron.cache.getCachedLikedSongs as jest.Mock).mockResolvedValue(
        mockCachedSongs
      );

      const { result } = renderHook(() => useGetLikedSongs("user-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.likedSongs).toEqual(mockCachedSongs);
      expect(window.electron.cache.getCachedLikedSongs).toHaveBeenCalledWith(
        "user-1"
      );
    });
  });
});
