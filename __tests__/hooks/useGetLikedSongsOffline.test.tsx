import { renderHook, waitFor, act } from "@testing-library/react";
import {
  QueryClient,
  QueryClientProvider,
  onlineManager,
} from "@tanstack/react-query";
import useGetLikedSongs from "@/hooks/data/useGetLikedSongs";
import { electronAPI } from "@/libs/electron-utils";
import React from "react";

// モックの設定
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
        staleTime: 0,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

// タイムアウトを10秒に設定
jest.setTimeout(10000);

describe("useGetLikedSongs (ローカルファースト)", () => {
  const mockGetCachedLikedSongs = electronAPI.cache
    .getCachedLikedSongs as jest.Mock;
  const mockIsElectron = electronAPI.isElectron as jest.Mock;

  const mockUserId = "test-user-id";
  const mockSongs = [
    { id: "1", title: "Liked Offline Song", created_at: "2023-01-01" },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsElectron.mockReturnValue(true);
    act(() => {
      onlineManager.setOnline(true);
    });
  });

  it("Electron環境では常にローカルDBからいいねした曲を取得する（オンライン時）", async () => {
    act(() => {
      onlineManager.setOnline(true);
    });

    mockGetCachedLikedSongs.mockResolvedValue(mockSongs);

    const { result } = renderHook(() => useGetLikedSongs(mockUserId), {
      wrapper: createWrapper(),
    });

    await waitFor(
      () => {
        expect(result.current.likedSongs).toEqual(mockSongs);
      },
      { timeout: 8000 }
    );

    // ローカルDBからの取得が呼ばれたことを確認
    expect(mockGetCachedLikedSongs).toHaveBeenCalledWith(mockUserId);

    // APIは呼ばれないことを確認（ローカルファーストのため）
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it("Electron環境では常にローカルDBからいいねした曲を取得する（オフライン時）", async () => {
    // オフライン設定
    act(() => {
      onlineManager.setOnline(false);
    });

    mockGetCachedLikedSongs.mockResolvedValue(mockSongs);

    const { result } = renderHook(() => useGetLikedSongs(mockUserId), {
      wrapper: createWrapper(),
    });

    await waitFor(
      () => {
        expect(result.current.likedSongs).toEqual(mockSongs);
      },
      { timeout: 8000 }
    );

    // APIが呼ばれていないことを確認
    expect(mockSupabase.from).not.toHaveBeenCalled();

    // キャッシュ取得が呼ばれたことを確認
    expect(mockGetCachedLikedSongs).toHaveBeenCalledWith(mockUserId);
  });

  it("Web版（非Electron環境）ではAPIからいいねした曲を取得する", async () => {
    // 非Electron環境を設定
    mockIsElectron.mockReturnValue(false);

    act(() => {
      onlineManager.setOnline(true);
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
      { timeout: 8000 }
    );

    // APIが呼ばれたことを確認
    expect(mockSupabase.from).toHaveBeenCalledWith("liked_songs_regular");

    // ローカルDBは呼ばれないことを確認
    expect(mockGetCachedLikedSongs).not.toHaveBeenCalled();
  });
});
