import React, { ReactNode } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import useGetLocalFiles from "@/hooks/data/useGetLocalFiles";

// モックの設定（フック読み込み前に設定）
const mockInvoke = jest.fn();

// window.electron をモック
Object.defineProperty(window, "electron", {
  value: {
    ipc: {
      invoke: mockInvoke,
    },
  },
  writable: true,
});

// wrapper を作成する関数
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useGetLocalFiles", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("ディレクトリが指定されていない場合は空の配列を返す", async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useGetLocalFiles(null), { wrapper });

    // enabled: false なので isLoading は false
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.files).toEqual([]);
  });

  it("ディレクトリが指定された場合、ファイルスキャンとメタデータ取得を実行", async () => {
    const mockFilePaths = ["/path/to/song1.mp3", "/path/to/song2.mp3"];
    const mockScanResult = {
      files: mockFilePaths,
      scanInfo: {
        newFiles: mockFilePaths,
        modifiedFiles: [],
        unchangedFiles: [],
        deletedFiles: [],
        isSameDirectory: false,
        isFullScan: true,
      },
    };

    const mockMetadata1 = {
      metadata: {
        common: { title: "Song 1", artist: "Artist 1" },
        format: { duration: 180 },
      },
      fromCache: false,
    };

    const mockMetadata2 = {
      metadata: {
        common: { title: "Song 2", artist: "Artist 2" },
        format: { duration: 200 },
      },
      fromCache: true,
    };

    mockInvoke
      .mockResolvedValueOnce(mockScanResult) // handle-scan-mp3-files
      .mockResolvedValueOnce(mockMetadata1) // handle-get-mp3-metadata for song1
      .mockResolvedValueOnce(mockMetadata2); // handle-get-mp3-metadata for song2

    const wrapper = createWrapper();
    const { result } = renderHook(() => useGetLocalFiles("/music/directory"), {
      wrapper,
    });

    // 初期状態はローディング中
    expect(result.current.isLoading).toBe(true);

    // データ取得完了を待機
    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 5000 }
    );

    // ファイルリストにメタデータが含まれている
    expect(result.current.files).toHaveLength(2);
    expect(result.current.files[0].path).toBe("/path/to/song1.mp3");
    expect(result.current.files[0].metadata?.common?.title).toBe("Song 1");
    expect(result.current.files[1].path).toBe("/path/to/song2.mp3");
    expect(result.current.files[1].metadata?.common?.title).toBe("Song 2");

    // スキャン情報が正しく設定されている
    expect(result.current.scanInfo).toEqual(mockScanResult.scanInfo);
  });

  it("スキャン時にエラーが発生した場合、エラーを返す", async () => {
    mockInvoke.mockResolvedValueOnce({
      error: "ディレクトリが見つかりません",
    });

    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useGetLocalFiles("/invalid/directory"),
      { wrapper }
    );

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 5000 }
    );

    expect(result.current.error).toBeTruthy();
  });

  it("forceFullScan で強制スキャンを実行できる", async () => {
    const mockScanResult = {
      files: ["/path/to/song.mp3"],
      scanInfo: {
        newFiles: ["/path/to/song.mp3"],
        modifiedFiles: [],
        unchangedFiles: [],
        deletedFiles: [],
        isSameDirectory: false,
        isFullScan: true,
      },
    };

    const mockMetadata = {
      metadata: {
        common: { title: "Song" },
      },
      fromCache: false,
    };

    mockInvoke
      .mockResolvedValueOnce(mockScanResult)
      .mockResolvedValueOnce(mockMetadata);

    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useGetLocalFiles("/music/directory", true), // forceFullScan = true
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // handle-scan-mp3-files が forceFullScan = true で呼ばれた
    expect(mockInvoke).toHaveBeenCalledWith(
      "handle-scan-mp3-files",
      "/music/directory",
      true
    );
  });
});
