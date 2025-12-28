/**
 * @jest-environment jsdom
 */
import React from "react";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import useBulkDownload from "@/hooks/downloads/useBulkDownload";

// window.electron のモック
const mockDownloadSong = jest.fn();
const mockCheckStatus = jest.fn();
const mockDeleteSong = jest.fn();

Object.defineProperty(window, "electron", {
  value: {
    offline: {
      downloadSong: mockDownloadSong,
      checkStatus: mockCheckStatus,
      deleteSong: mockDeleteSong,
    },
    appInfo: {
      isElectron: true,
    },
  },
  writable: true,
  configurable: true,
});

jest.mock("@/libs/supabase/client", () => ({
  createClient: () => ({}),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const mockSongs = [
  {
    id: "1",
    title: "Song 1",
    song_path: "url1",
    author: "Author 1",
    image_path: "img1",
  },
  {
    id: "2",
    title: "Song 2",
    song_path: "url2",
    author: "Author 2",
    image_path: "img2",
  },
] as any;

describe("useBulkDownload", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDownloadSong.mockResolvedValue({
      success: true,
      localPath: "/path/to/song.mp3",
    });
    mockCheckStatus.mockResolvedValue({ isDownloaded: false, localPath: null });
    mockDeleteSong.mockResolvedValue({ success: true });
  });

  it("初期状態では isDownloading と isDeleting が false", async () => {
    const { result } = renderHook(() => useBulkDownload(mockSongs), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isDownloading).toBe(false);
      expect(result.current.isDeleting).toBe(false);
    });
  });

  it("downloadAll を呼ぶと曲を順次ダウンロードする", async () => {
    const { result } = renderHook(() => useBulkDownload(mockSongs), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.downloadAll();
    });

    expect(mockDownloadSong).toHaveBeenCalledTimes(2);
    expect(result.current.downloadedCount).toBe(2);
    expect(result.current.isDownloading).toBe(false);
    expect(result.current.isAllDownloaded).toBe(true);
  });

  it("既にダウンロード済みの曲はスキップする", async () => {
    mockCheckStatus.mockImplementation((songId: string) => {
      if (songId === "1") {
        return Promise.resolve({
          isDownloaded: true,
          localPath: "/path/1.mp3",
        });
      }
      return Promise.resolve({ isDownloaded: false, localPath: null });
    });

    const { result } = renderHook(() => useBulkDownload(mockSongs), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.downloadAll();
    });

    // Song 1 はダウンロード済みなのでスキップ
    expect(mockDownloadSong).toHaveBeenCalledTimes(1);
    expect(mockDownloadSong).toHaveBeenCalledWith(
      expect.objectContaining({ id: "2" })
    );
  });

  it("全曲ダウンロード済みの場合 isAllDownloaded が true", async () => {
    mockCheckStatus.mockResolvedValue({
      isDownloaded: true,
      localPath: "/path/song.mp3",
    });

    const { result } = renderHook(() => useBulkDownload(mockSongs), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isAllDownloaded).toBe(true);
      expect(result.current.downloadedSongsCount).toBe(2);
    });
  });

  it("deleteAll を呼ぶとダウンロード済みの曲を削除する", async () => {
    mockCheckStatus.mockResolvedValue({
      isDownloaded: true,
      localPath: "/path/song.mp3",
    });

    const { result } = renderHook(() => useBulkDownload(mockSongs), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isAllDownloaded).toBe(true);
    });

    await act(async () => {
      await result.current.deleteAll();
    });

    expect(mockDeleteSong).toHaveBeenCalledTimes(2);
    expect(result.current.isAllDownloaded).toBe(false);
  });
});
