import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import useGetLikedSongs from "@/hooks/data/useGetLikedSongs";
import { useOfflineCache } from "@/hooks/utils/useOfflineCache";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";
import React from "react";

// モックの設定
jest.mock("@/hooks/utils/useOfflineCache");
jest.mock("@/hooks/utils/useNetworkStatus");

// Supabaseクライアントのモック
const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest
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

describe("useGetLikedSongs (Offline Support)", () => {
  const mockSaveToCache = jest.fn().mockResolvedValue(undefined);
  const mockLoadFromCache = jest.fn();
  const mockUseNetworkStatus = useNetworkStatus as jest.Mock;

  const mockUserId = "test-user-id";
  const mockSongs = [{ id: "1", title: "Liked Offline Song" }];

  beforeEach(() => {
    jest.clearAllMocks();
    (useOfflineCache as jest.Mock).mockReturnValue({
      saveToCache: mockSaveToCache,
      loadFromCache: mockLoadFromCache,
    });
  });

  it("オンライン時はAPIからいいねした曲を取得し、キャッシュに保存する", async () => {
    mockSupabase.order.mockResolvedValue({
      data: [{ songs: mockSongs[0] }],
      error: null,
    });

    mockUseNetworkStatus.mockReturnValue({ isOnline: true });

    const { result } = renderHook(() => useGetLikedSongs(mockUserId), {
      wrapper: createWrapper(),
    });

    await waitFor(
      () => {
        expect(result.current.likedSongs).toHaveLength(1);
        expect(result.current.likedSongs[0].title).toBe("Liked Offline Song");
      },
      { timeout: 10000 }
    );

    // キャッシュ保存が呼ばれたことを確認
    await waitFor(
      () => {
        expect(mockSaveToCache).toHaveBeenCalledWith(
          expect.stringContaining(`likedSongs:${mockUserId}`),
          expect.any(Array)
        );
      },
      { timeout: 10000 }
    );
  });

  it("オフライン時はキャッシュからいいねした曲を取得する", async () => {
    mockUseNetworkStatus.mockReturnValue({ isOnline: false });
    mockLoadFromCache.mockResolvedValue(mockSongs);

    const { result } = renderHook(() => useGetLikedSongs(mockUserId), {
      wrapper: createWrapper(),
    });

    await waitFor(
      () => {
        expect(result.current.likedSongs).toEqual(mockSongs);
      },
      { timeout: 10000 }
    );

    // APIが呼ばれていないことを確認
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });
});
