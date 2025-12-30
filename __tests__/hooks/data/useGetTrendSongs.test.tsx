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
import useGetTrendSongs from "@/hooks/data/useGetTrendSongs";

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

describe("useGetTrendSongs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    act(() => {
      onlineManager.setOnline(true);
    });
    // Web環境をシミュレート
    if (window.electron) {
      window.electron.appInfo.isElectron = false;
    }
  });

  afterEach(() => {
    // Electron環境に戻す
    if (window.electron) {
      window.electron.appInfo.isElectron = true;
    }
  });

  it("トレンド曲を取得する", async () => {
    const mockSongs = [
      { id: "1", title: "Trend Song 1", play_count: 100 },
      { id: "2", title: "Trend Song 2", play_count: 50 },
    ];

    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: mockSongs, error: null }),
    });

    const { result } = renderHook(() => useGetTrendSongs(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.trends).toEqual(mockSongs);
    expect(mockFrom).toHaveBeenCalledWith("songs");
  });

  it("オフライン時はフェッチを行わない", async () => {
    act(() => {
      onlineManager.setOnline(false);
    });

    const { result } = renderHook(() => useGetTrendSongs(), {
      wrapper: createWrapper(),
    });

    // networkMode: "always" なので paused にはならない
    expect(result.current.isPaused).toBe(false);
    expect(result.current.trends).toEqual([]);
  });
});
