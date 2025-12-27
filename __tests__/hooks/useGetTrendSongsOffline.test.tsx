import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import useGetTrendSongs from "@/hooks/data/useGetTrendSongs";
import { useOfflineCache } from "@/hooks/utils/useOfflineCache";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";
import { createClient } from "@/libs/supabase/client";
import React from "react";

// モックの設定
jest.mock("@/hooks/utils/useOfflineCache");
jest.mock("@/hooks/utils/useNetworkStatus");
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
  const mockSaveToCache = jest.fn().mockResolvedValue(undefined);
  const mockLoadFromCache = jest.fn();
  const mockUseNetworkStatus = useNetworkStatus as jest.Mock;
  const mockCreateClient = createClient as jest.Mock;

  const mockSongs = [{ id: "1", title: "Trend Song", count: 100 }];

  beforeEach(() => {
    jest.clearAllMocks();
    (useOfflineCache as jest.Mock).mockReturnValue({
      saveToCache: mockSaveToCache,
      loadFromCache: mockLoadFromCache,
      isCacheValid: jest.fn().mockResolvedValue(true),
      clearCache: jest.fn(),
    });
  });

  it("オンライン時はSupabaseからデータを取得し、キャッシュに保存する", async () => {
    mockUseNetworkStatus.mockReturnValue({ isOnline: true });
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

    // フェッチ完了を待つ (isLoading: false になるまで)
    await waitFor(
      () => {
        expect(result.current.trends).toEqual(mockSongs);
      },
      { timeout: 5000 }
    );

    // キャッシュ保存が呼ばれたことを確認
    await waitFor(
      () => {
        expect(mockSaveToCache).toHaveBeenCalledWith(
          expect.stringContaining("trendSongs:all"),
          mockSongs
        );
      },
      { timeout: 5000 }
    );
  });

  it("オフライン時はキャッシュからデータを取得する", async () => {
    mockUseNetworkStatus.mockReturnValue({ isOnline: false });
    mockLoadFromCache.mockResolvedValue(mockSongs);

    const { result } = renderHook(() => useGetTrendSongs("all"), {
      wrapper: createWrapper(),
    });

    await waitFor(
      () => {
        expect(result.current.trends).toEqual(mockSongs);
      },
      { timeout: 5000 }
    );

    // Supabase clientが呼ばれていないことを確認（オフラインなので）
    expect(mockCreateClient().from).not.toHaveBeenCalled?.();
  });
});
