import { renderHook, act, waitFor } from "@testing-library/react";
import useDownloadSong from "@/hooks/utils/useDownloadSong";
import { Song } from "@/types";

// electronAPIをモック
jest.mock("@/libs/electron-utils", () => ({
  electronAPI: {
    isElectron: jest.fn(),
    downloader: {
      downloadSong: jest.fn(),
      checkFileExists: jest.fn(),
      deleteSong: jest.fn(),
    },
  },
}));

import { electronAPI } from "@/libs/electron-utils";

describe("useDownloadSong", () => {
  const mockSong: Song = {
    id: "1",
    user_id: "user1", // 追加
    title: "Test Song",
    author: "Test Artist",
    song_path: "https://example.com/song.mp3",
    image_path: "cover.jpg",
    created_at: new Date().toISOString(), // 追加
  };

  const mockDownloadSong = electronAPI.downloader.downloadSong as jest.Mock;
  const mockCheckFileExists = electronAPI.downloader
    .checkFileExists as jest.Mock;
  const mockDeleteSong = electronAPI.downloader.deleteSong as jest.Mock;
  const mockIsElectron = electronAPI.isElectron as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsElectron.mockReturnValue(true); // Electron環境と仮定
  });

  it("ダウンロードを開始すると、isDownloadingがtrueになり、IPCが呼ばれる", async () => {
    mockDownloadSong.mockResolvedValue("/local/path/song.mp3");
    mockCheckFileExists.mockResolvedValue(false);

    const { result } = renderHook(() => useDownloadSong(mockSong));

    await act(async () => {
      await result.current.download();
    });

    expect(result.current.isDownloading).toBe(false);
    expect(result.current.isDownloaded).toBe(true);
    expect(mockDownloadSong).toHaveBeenCalledWith(
      mockSong.song_path,
      expect.stringContaining("Test Song")
    );
  });

  it("既にファイルが存在する場合はダウンロードしない", async () => {
    mockCheckFileExists.mockResolvedValue(true);

    const { result } = renderHook(() => useDownloadSong(mockSong));

    await waitFor(() => {
      expect(result.current.isDownloaded).toBe(true);
    });

    await act(async () => {
      await result.current.download();
    });

    expect(mockDownloadSong).not.toHaveBeenCalled();
  });

  it("ダウンロード中にエラーが発生した場合、エラー状態になる", async () => {
    mockCheckFileExists.mockResolvedValue(false);
    mockDownloadSong.mockRejectedValue(new Error("Download failed"));

    const { result } = renderHook(() => useDownloadSong(mockSong));

    await act(async () => {
      try {
        await result.current.download();
      } catch (e) {
        // エラーは想定内
      }
    });

    expect(result.current.isDownloading).toBe(false);
    expect(result.current.error).toBe("Download failed");
    expect(result.current.isDownloaded).toBe(false);
  });

  // 追加: 削除機能のテスト
  it("キャッシュを削除できる", async () => {
    mockCheckFileExists.mockResolvedValue(true); // 最初はダウンロード済み
    mockDeleteSong.mockResolvedValue(true); // 削除成功

    const { result } = renderHook(() => useDownloadSong(mockSong));

    await waitFor(() => {
      expect(result.current.isDownloaded).toBe(true);
    });

    await act(async () => {
      await result.current.remove();
    });

    expect(mockDeleteSong).toHaveBeenCalledWith(
      expect.stringContaining("Test Song")
    );
    expect(result.current.isDownloaded).toBe(false);
  });
});
