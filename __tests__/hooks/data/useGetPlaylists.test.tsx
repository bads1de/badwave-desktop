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

// モック
jest.mock("@/hooks/auth/useUser");
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
  beforeEach(() => {
    jest.clearAllMocks();
    (useUser as jest.Mock).mockReturnValue({ user: { id: "user-1" } });
    act(() => {
      onlineManager.setOnline(true);
    });
  });

  describe("オンライン時", () => {
    it("Supabaseからプレイリストを取得し、キャッシュに同期する", async () => {
      const mockPlaylists = [
        { id: "p1", title: "Playlist 1", user_id: "user-1" },
      ];

      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockPlaylists, error: null }),
      });

      const { result } = renderHook(() => useGetPlaylists(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.playlists).toEqual(mockPlaylists);
      expect(window.electron.cache.syncPlaylists).toHaveBeenCalledWith(
        mockPlaylists
      );
    });
  });

  describe("オフライン時", () => {
    it("SQLiteキャッシュからプレイリストを取得する", async () => {
      act(() => {
        onlineManager.setOnline(false);
      });

      const mockCachedPlaylists = [
        { id: "p-cached", title: "Cached Playlist", user_id: "user-1" },
      ];
      (window.electron.cache.getCachedPlaylists as jest.Mock).mockResolvedValue(
        mockCachedPlaylists
      );

      const { result } = renderHook(() => useGetPlaylists(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.playlists).toEqual(mockCachedPlaylists);
      expect(window.electron.cache.getCachedPlaylists).toHaveBeenCalledWith(
        "user-1"
      );
    });
  });
});
