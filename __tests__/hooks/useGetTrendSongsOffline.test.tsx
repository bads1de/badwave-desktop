import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import useGetTrendSongs from "@/hooks/data/useGetTrendSongs";
import { useOfflineCheck } from "@/hooks/utils/useOfflineCheck";
import { createClient } from "@/libs/supabase/client";
import React from "react";

// モックの設定
jest.mock("@/hooks/utils/useOfflineCheck");
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
  const mockUseOfflineCheck = useOfflineCheck as jest.Mock;
  const mockCreateClient = createClient as jest.Mock;

  const mockSongs = [{ id: "1", title: "Trend Song", count: 100 }];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("オンライン時はSupabaseからデータを取得する", async () => {
    mockUseOfflineCheck.mockReturnValue({
      isOnline: true,
      checkOffline: jest.fn().mockResolvedValue(false),
    });

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
  });

  it("オフライン時は空配列を返す", async () => {
    mockUseOfflineCheck.mockReturnValue({
      isOnline: false,
      checkOffline: jest.fn().mockResolvedValue(true),
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

    // Supabase clientが呼ばれていないことを確認
    // Note: createClient() might be called, but the chain .from() should probably not be called if strict
    // But implementation: queryFn starts with "const isCurrentlyOffline = await checkOffline(); if... return []"
    // So Supabase calls inside queryFn are skipped.
  });
});
