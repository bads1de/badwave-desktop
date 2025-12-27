import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import useGetTopPlayedSongs from "@/hooks/data/useGetTopPlayedSongs";
import { useOfflineCache } from "@/hooks/utils/useOfflineCache";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";
import React from "react";

// モックの設定
jest.mock("@/hooks/utils/useOfflineCache");
jest.mock("@/hooks/utils/useNetworkStatus");

// Supabaseクライアントのモック
const mockSupabase = {
  rpc: jest
    .fn()
    .mockImplementation(() => Promise.resolve({ data: [], error: null })),
};

jest.mock("@/libs/supabase/client", () => ({
  createClient: jest.fn(() => mockSupabase),
}));

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

describe("useGetTopPlayedSongs (Offline Support)", () => {
  const mockSaveToCache = jest.fn().mockResolvedValue(undefined);
  const mockLoadFromCache = jest.fn();
  const mockUseNetworkStatus = useNetworkStatus as jest.Mock;

  const mockUserId = "test-user-id";
  const mockSongs = [{ id: "1", title: "Top Played Song", play_count: 10 }];

  beforeEach(() => {
    jest.clearAllMocks();
    (useOfflineCache as jest.Mock).mockReturnValue({
      saveToCache: mockSaveToCache,
      loadFromCache: mockLoadFromCache,
    });
  });

  it("オンライン時はRPCから曲を取得し、キャッシュに保存する", async () => {
    mockSupabase.rpc.mockResolvedValue({
      data: mockSongs,
      error: null,
    });

    mockUseNetworkStatus.mockReturnValue({ isOnline: true });

    const { result } = renderHook(
      () => useGetTopPlayedSongs(mockUserId, "day"),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(
      () => {
        expect(result.current.topSongs).toEqual(mockSongs);
      },
      { timeout: 10000 }
    );

    // キャッシュ保存が呼ばれたことを確認
    await waitFor(
      () => {
        expect(mockSaveToCache).toHaveBeenCalledWith(
          expect.stringContaining(`getTopSongs:${mockUserId}:day`),
          mockSongs
        );
      },
      { timeout: 10000 }
    );
  });

  it("オフライン時はキャッシュから曲を取得する", async () => {
    mockUseNetworkStatus.mockReturnValue({ isOnline: false });
    mockLoadFromCache.mockResolvedValue(mockSongs);

    const { result } = renderHook(
      () => useGetTopPlayedSongs(mockUserId, "day"),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(
      () => {
        expect(result.current.topSongs).toEqual(mockSongs);
      },
      { timeout: 10000 }
    );

    // RPCが呼ばれていないことを確認
    expect(mockSupabase.rpc).not.toHaveBeenCalled();
  });
});
