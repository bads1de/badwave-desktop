import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import useGetSongById from "@/hooks/data/useGetSongById";
import { useOfflineCache } from "@/hooks/utils/useOfflineCache";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";
import React from "react";

// モックの設定
jest.mock("@/hooks/utils/useOfflineCache");
jest.mock("@/hooks/utils/useNetworkStatus");
jest.mock("react-hot-toast");

// Supabaseクライアントのモック
const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  maybeSingle: jest
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

describe("useGetSongById (Offline Support)", () => {
  const mockSaveToCache = jest.fn().mockResolvedValue(undefined);
  const mockLoadFromCache = jest.fn();
  const mockUseNetworkStatus = useNetworkStatus as jest.Mock;

  const mockSongId = "test-song-id";
  const mockSong = { id: mockSongId, title: "Offline Metadata Song" };

  beforeEach(() => {
    jest.clearAllMocks();
    (useOfflineCache as jest.Mock).mockReturnValue({
      saveToCache: mockSaveToCache,
      loadFromCache: mockLoadFromCache,
    });
  });

  it("オンライン時はAPIから曲情報を取得し、キャッシュに保存する", async () => {
    mockSupabase.maybeSingle.mockResolvedValue({
      data: mockSong,
      error: null,
    });

    mockUseNetworkStatus.mockReturnValue({ isOnline: true });

    const { result } = renderHook(() => useGetSongById(mockSongId), {
      wrapper: createWrapper(),
    });

    await waitFor(
      () => {
        expect(result.current.song).toEqual(mockSong);
      },
      { timeout: 10000 }
    );

    // キャッシュ保存が呼ばれたことを確認
    await waitFor(
      () => {
        expect(mockSaveToCache).toHaveBeenCalledWith(
          expect.stringContaining(`${mockSongId}`),
          mockSong
        );
      },
      { timeout: 10000 }
    );
  });

  it("オフライン時はキャッシュから曲情報を取得する", async () => {
    mockUseNetworkStatus.mockReturnValue({ isOnline: false });
    mockLoadFromCache.mockResolvedValue(mockSong);

    const { result } = renderHook(() => useGetSongById(mockSongId), {
      wrapper: createWrapper(),
    });

    await waitFor(
      () => {
        expect(result.current.song).toEqual(mockSong);
      },
      { timeout: 10000 }
    );

    // APIが呼ばれていないことを確認
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it("ローカルにファイルが存在する場合はローカルパスを使用する", async () => {
    mockSupabase.maybeSingle.mockResolvedValue({
      data: mockSong,
      error: null,
    });
    mockUseNetworkStatus.mockReturnValue({ isOnline: true });

    // electronのモック拡張
    const mockCheckFileExists = jest.fn().mockResolvedValue(true);
    const mockGetLocalFilePath = jest
      .fn()
      .mockResolvedValue("C:\\Downloads\\Song.mp3");

    // 既存のelectronプロパティがあるかもしれないので配慮するが、今回は上書きでOK
    Object.defineProperty(window, "electron", {
      value: {
        checkFileExists: mockCheckFileExists,
        getLocalFilePath: mockGetLocalFilePath,
      },
      writable: true,
      configurable: true,
    });

    // songUtilsのモックは jest.mock しているので、実装に合わせて調整が必要
    // ここでは単純に toFileUrl をモックか、実体を使うか...
    // libs/songUtilsはこのテストファイルではモックされていないので実動作するはず

    const { result } = renderHook(() => useGetSongById(mockSongId), {
      wrapper: createWrapper(),
    });

    await waitFor(
      () => {
        expect(result.current.song).toBeDefined();
        // パスが書き換わっていることを確認
        // toFileUrlの実装に依存: Windowsパスなら file:///...
        expect(result.current.song?.song_path).toMatch(/^file:\/\//);
      },
      { timeout: 10000 }
    );
  });
});
