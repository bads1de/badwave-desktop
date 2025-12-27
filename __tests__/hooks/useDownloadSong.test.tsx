import { renderHook, act, waitFor } from "@testing-library/react";
import useDownloadSong from "@/hooks/utils/useDownloadSong";
import { Song } from "@/types";

// electronAPIをモック（新しいオフラインAPI対応）
jest.mock("@/libs/electron-utils", () => ({
  electronAPI: {
    isElectron: jest.fn(),
    offline: {
      downloadSong: jest.fn(),
      checkStatus: jest.fn(),
      deleteSong: jest.fn(),
    },
  },
}));

import { electronAPI } from "@/libs/electron-utils";

describe("useDownloadSong", () => {
  const mockSong: Song = {
    id: "song-uuid-123",
    user_id: "user1",
    title: "Test Song",
    author: "Test Artist",
    song_path: "https://example.com/song.mp3",
    image_path: "https://example.com/cover.jpg",
    created_at: new Date().toISOString(),
    duration: 180,
    genre: "Pop",
    lyrics: "Test lyrics",
  };

  const mockDownloadSong = electronAPI.offline.downloadSong as jest.Mock;
  const mockCheckStatus = electronAPI.offline.checkStatus as jest.Mock;
  const mockDeleteSong = electronAPI.offline.deleteSong as jest.Mock;
  const mockIsElectron = electronAPI.isElectron as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsElectron.mockReturnValue(true);
  });

  it("ダウンロードを開始すると、オフラインIPCが呼ばれてDBに保存される", async () => {
    mockDownloadSong.mockResolvedValue({
      success: true,
      localPath: "file://...",
    });
    mockCheckStatus.mockResolvedValue({ isDownloaded: false });

    const { result } = renderHook(() => useDownloadSong(mockSong));

    await act(async () => {
      await result.current.download();
    });

    expect(result.current.isDownloading).toBe(false);
    expect(result.current.isDownloaded).toBe(true);
    expect(mockDownloadSong).toHaveBeenCalledWith({
      id: mockSong.id,
      userId: mockSong.user_id,
      title: mockSong.title,
      author: mockSong.author,
      song_path: mockSong.song_path,
      image_path: mockSong.image_path,
      duration: mockSong.duration,
      genre: mockSong.genre,
      lyrics: mockSong.lyrics,
      created_at: mockSong.created_at,
    });
  });

  it("既にダウンロード済みの場合は再ダウンロードしない", async () => {
    mockCheckStatus.mockResolvedValue({ isDownloaded: true });

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
    mockCheckStatus.mockResolvedValue({ isDownloaded: false });
    mockDownloadSong.mockResolvedValue({
      success: false,
      error: "Download failed",
    });

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

  it("オフラインデータを削除できる（ファイル + DB）", async () => {
    mockCheckStatus.mockResolvedValue({ isDownloaded: true });
    mockDeleteSong.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useDownloadSong(mockSong));

    await waitFor(() => {
      expect(result.current.isDownloaded).toBe(true);
    });

    await act(async () => {
      await result.current.remove();
    });

    expect(mockDeleteSong).toHaveBeenCalledWith(mockSong.id);
    expect(result.current.isDownloaded).toBe(false);
  });

  it("Electron環境でない場合はダウンロードできない", async () => {
    mockIsElectron.mockReturnValue(false);

    const { result } = renderHook(() => useDownloadSong(mockSong));

    await act(async () => {
      try {
        await result.current.download();
      } catch (e) {
        // エラーは想定内
      }
    });

    expect(mockDownloadSong).not.toHaveBeenCalled();
    expect(result.current.error).toContain("Electron API");
  });
});
