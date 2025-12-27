import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import useGetPlaylist from "@/hooks/data/useGetPlaylist";
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
  single: jest
    .fn()
    .mockImplementation(() => Promise.resolve({ data: null, error: null })),
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

describe("useGetPlaylist (Offline Support)", () => {
  const mockSaveToCache = jest.fn().mockResolvedValue(undefined);
  const mockLoadFromCache = jest.fn();
  const mockUseNetworkStatus = useNetworkStatus as jest.Mock;

  const mockPlaylistId = "test-playlist-id";
  const mockPlaylist = { id: mockPlaylistId, name: "Offline Playlist" };

  beforeEach(() => {
    jest.clearAllMocks();
    (useOfflineCache as jest.Mock).mockReturnValue({
      saveToCache: mockSaveToCache,
      loadFromCache: mockLoadFromCache,
    });
  });

  it("オンライン時はAPIからプレイリスト情報を取得し、キャッシュに保存する", async () => {
    mockSupabase.single.mockResolvedValue({
      data: mockPlaylist,
      error: null,
    });

    mockUseNetworkStatus.mockReturnValue({ isOnline: true });

    const { result } = renderHook(() => useGetPlaylist(mockPlaylistId), {
      wrapper: createWrapper(),
    });

    await waitFor(
      () => {
        expect(result.current.playlist).toEqual(mockPlaylist);
      },
      { timeout: 10000 }
    );

    // キャッシュ保存が呼ばれたことを確認
    await waitFor(
      () => {
        expect(mockSaveToCache).toHaveBeenCalledWith(
          expect.stringContaining(`${mockPlaylistId}`),
          mockPlaylist
        );
      },
      { timeout: 10000 }
    );
  });

  it("オフライン時はキャッシュからプレイリスト情報を取得する", async () => {
    mockUseNetworkStatus.mockReturnValue({ isOnline: false });
    mockLoadFromCache.mockResolvedValue(mockPlaylist);

    const { result } = renderHook(() => useGetPlaylist(mockPlaylistId), {
      wrapper: createWrapper(),
    });

    await waitFor(
      () => {
        expect(result.current.playlist).toEqual(mockPlaylist);
      },
      { timeout: 10000 }
    );

    // APIが呼ばれていないことを確認
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });
});
