import { renderHook, waitFor, act } from "@testing-library/react";
import {
  QueryClient,
  QueryClientProvider,
  onlineManager,
} from "@tanstack/react-query";
import useGetSongsByGenre from "@/hooks/data/useGetSongsByGenre";
import { createClient } from "@/libs/supabase/client";
import React from "react";

// モックの設定
jest.mock("@/libs/supabase/client");

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

describe("useGetSongsByGenre (Offline Support)", () => {
  const mockCreateClient = createClient as jest.Mock;
  const mockSongs = [
    { id: "1", title: "Genre Song 1", genre: "Rock" },
    { id: "2", title: "Genre Song 2", genre: "Rock" },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // デフォルトはオンライン
    act(() => {
      onlineManager.setOnline(true);
    });
  });

  it("オンライン時はSupabaseから特定のジャンルの曲を取得する", async () => {
    const mockFrom = jest.fn().mockReturnThis();
    const mockSelect = jest.fn().mockReturnThis();
    const mockOr = jest.fn().mockReturnThis();
    const mockOrder = jest
      .fn()
      .mockResolvedValue({ data: mockSongs, error: null });

    mockCreateClient.mockReturnValue({
      from: mockFrom,
      select: mockSelect,
      or: mockOr,
      order: mockOrder,
    });

    const { result } = renderHook(() => useGetSongsByGenre("Rock"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.songs).toEqual(mockSongs);
    });

    expect(mockFrom).toHaveBeenCalledWith("songs");
    expect(mockOr).toHaveBeenCalledWith("genre.ilike.%Rock%");
  });

  it("複数のジャンルが指定された場合に正しくクエリを発行する", async () => {
    const mockOr = jest.fn().mockReturnThis();
    const mockOrder = jest
      .fn()
      .mockResolvedValue({ data: mockSongs, error: null });

    mockCreateClient.mockReturnValue({
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      or: mockOr,
      order: mockOrder,
    });

    renderHook(() => useGetSongsByGenre(["Rock", "Pop"]), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockOr).toHaveBeenCalledWith(
        "genre.ilike.%Rock%,genre.ilike.%Pop%"
      );
    });
  });

  it("オフライン時はクエリが一時停止される", async () => {
    // オフライン設定
    act(() => {
      onlineManager.setOnline(false);
    });

    const mockFrom = jest.fn().mockReturnThis();
    mockCreateClient.mockReturnValue({
      from: mockFrom,
    });

    const { result } = renderHook(() => useGetSongsByGenre("Rock"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isPaused).toBe(true);
    });

    // Supabase clientのfromメソッド（データ取得）が呼ばれていないことを確認
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
