import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider, onlineManager } from "@tanstack/react-query";
import useGetTrendSongs from "@/hooks/data/useGetTrendSongs";
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

describe("useGetTrendSongs (Offline Support)", () => {
  const mockCreateClient = createClient as jest.Mock;

  const mockSongs = [{ id: "1", title: "Trend Song", count: 100 }];

  beforeEach(() => {
    jest.clearAllMocks();
    act(() => {
      onlineManager.setOnline(true);
    });
    if (window.electron) {
      window.electron.appInfo.isElectron = false;
    }
  });

  afterEach(() => {
    if (window.electron) {
      window.electron.appInfo.isElectron = true;
    }
  });

  it("オンライン時はSupabaseからデータを取得する", async () => {
    mockCreateClient.mockReturnValue({
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          filter: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnValue({
            limit: jest
              .fn()
              .mockResolvedValue({ data: mockSongs, error: null }),
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useGetTrendSongs("all"), {
      wrapper: createWrapper(),
    });

    await waitFor(
      () => {
        expect(result.current.trends).toEqual(mockSongs);
      },
      { timeout: 5000 }
    );
  });

  it("オフライン時は空配列を返す", async () => {
    act(() => {
      onlineManager.setOnline(false);
    });

    const { result } = renderHook(() => useGetTrendSongs("all"), {
      wrapper: createWrapper(),
    });

    await waitFor(
      () => {
        expect(result.current.trends).toEqual([]);
      },
      { timeout: 5000 }
    );
  });
});