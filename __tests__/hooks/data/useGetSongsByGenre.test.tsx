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
import useGetSongsByGenre from "@/hooks/data/useGetSongsByGenre";

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

describe("useGetSongsByGenre", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    act(() => {
      onlineManager.setOnline(true);
    });
  });

  it("単一のジャンルで曲を検索する", async () => {
    const mockSongs = [{ id: "1", title: "Rock Song", genre: "Rock" }];
    const mockOr = jest.fn().mockReturnThis();
    const mockOrder = jest.fn().mockResolvedValue({ data: mockSongs, error: null });

    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      or: mockOr,
      order: mockOrder,
    });

    const { result } = renderHook(() => useGetSongsByGenre("Rock"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.songs).toEqual(mockSongs);
    expect(mockOr).toHaveBeenCalledWith("genre.ilike.%Rock%");
  });

  it("複数のジャンルで曲を検索する", async () => {
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: [], error: null }),
    });

    renderHook(() => useGetSongsByGenre(["Rock", "Pop"]), {
      wrapper: createWrapper(),
    });

    expect(mockFrom().or).toHaveBeenCalledWith("genre.ilike.%Rock%,genre.ilike.%Pop%");
  });

  it("ジャンルが空の場合はクエリを実行しない", () => {
    const { result } = renderHook(() => useGetSongsByGenre([]), {
      wrapper: createWrapper(),
    });

    expect(result.current.songs).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
