import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import useGetLikedSongs from "@/hooks/data/useGetLikedSongs";
import { useOfflineCheck } from "@/hooks/utils/useOfflineCheck";
import { electronAPI } from "@/libs/electron-utils";
import React from "react";

// モックの設定
jest.mock("@/hooks/utils/useOfflineCheck");
jest.mock("@/libs/electron-utils", () => ({
  electronAPI: {
    isElectron: jest.fn(),
    cache: {
      getCachedLikedSongs: jest.fn(),
      syncLikedSongs: jest.fn(),
    },
  },
}));

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
  const mockUseOfflineCheck = useOfflineCheck as jest.Mock;
  const mockGetCachedLikedSongs = electronAPI.cache
    .getCachedLikedSongs as jest.Mock;
  const mockSyncLikedSongs = electronAPI.cache.syncLikedSongs as jest.Mock;
  const mockIsElectron = electronAPI.isElectron as jest.Mock;

  const mockUserId = "test-user-id";
  const mockSongs = [
    { id: "1", title: "Liked Offline Song", created_at: "2023-01-01" },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsElectron.mockReturnValue(true);
    mockSyncLikedSongs.mockResolvedValue(undefined);
  });

  it("オンライン時はAPIからいいねした曲を取得し、キャッシュに保存する", async () => {
    // オンライン設定
    mockUseOfflineCheck.mockReturnValue({
      isOnline: true,
      isInitialized: true,
      checkOffline: jest.fn().mockResolvedValue(false),
    });

    mockSupabase.order.mockResolvedValue({
      data: [{ songs: mockSongs[0] }],
      error: null,
    });

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

    // APIが呼ばれたことを確認
    expect(mockSupabase.from).toHaveBeenCalledWith("liked_songs_regular");

    // キャッシュ保存（syncLikedSongs）が呼ばれたことを確認
    await waitFor(
      () => {
        expect(mockSyncLikedSongs).toHaveBeenCalledWith(
          mockUserId,
          expect.anything() // Song object transform verification if needed
        );
      },
      { timeout: 10000 }
    );
  });

  it("オフライン時はSQLiteキャッシュからいいねした曲を取得する", async () => {
    // オフライン設定
    mockUseOfflineCheck.mockReturnValue({
      isOnline: false,
      isInitialized: true,
      checkOffline: jest.fn().mockResolvedValue(true),
    });

    mockGetCachedLikedSongs.mockResolvedValue(mockSongs);

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

    // キャッシュ取得が呼ばれたことを確認
    expect(mockGetCachedLikedSongs).toHaveBeenCalledWith(mockUserId);
  });
});
