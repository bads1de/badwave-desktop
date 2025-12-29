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
import useGetSongs from "@/hooks/data/useGetSongs";

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

describe("useGetSongs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    act(() => {
      onlineManager.setOnline(true);
    });
  });

  it("最新曲を取得する", async () => {
    const mockSongs = [
      { id: "1", title: "Song 1", created_at: "2023-01-01" },
      { id: "2", title: "Song 2", created_at: "2023-01-02" },
    ];

    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: mockSongs, error: null }),
    });

    const { result } = renderHook(() => useGetSongs(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.songs).toEqual(mockSongs);
    expect(mockFrom).toHaveBeenCalledWith("songs");
  });

  it("エラー発生時に適切に処理する", async () => {
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({
        data: null,
        error: { message: "Fetch error" },
      }),
    });

    const { result } = renderHook(() => useGetSongs(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.songs).toEqual([]);
    expect(result.current.error).toBeDefined();
  });

  it("オフライン時は一時停止状態になる", async () => {
    act(() => {
      onlineManager.setOnline(false);
    });

    const { result } = renderHook(() => useGetSongs(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPaused).toBe(true);
  });
});
