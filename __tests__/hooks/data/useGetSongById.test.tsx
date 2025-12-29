/**
 * @jest-environment jsdom
 */
import React from "react";
import { renderHook, waitFor, act } from "@testing-library/react";
import {
  QueryClient,
  QueryClientProvider,
  onlineManager,
} from "@tanstack/react-query";
import useGetSongById from "@/hooks/data/useGetSongById";

// モック
const mockFrom = jest.fn();
jest.mock("@/libs/supabase/client", () => ({
  createClient: () => ({
    from: mockFrom,
  }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useGetSongById", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    act(() => {
      onlineManager.setOnline(true);
    });
  });

  it("IDに基づいて曲を取得する", async () => {
    const mockSong = { id: "song-1", title: "Test Song", song_path: "remote/path" };

    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: mockSong, error: null }),
    });

    // 初期状態はダウンロードされていない
    (window.electron.offline.checkStatus as jest.Mock).mockResolvedValue({
      isDownloaded: false,
    });

    const { result } = renderHook(() => useGetSongById("song-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await waitFor(() => {
      expect(result.current.song?.id).toBe("song-1");
    });

    expect(result.current.song?.song_path).toBe("remote/path");
  });

  it("ダウンロード済みの場合はローカルパスを返す", async () => {
    const mockSong = { id: "song-1", title: "Test Song", song_path: "remote/path" };

    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: mockSong, error: null }),
    });

    // ダウンロード済み
    (window.electron.offline.checkStatus as jest.Mock).mockResolvedValue({
      isDownloaded: true,
      localPath: "local/path.mp3",
    });

    const { result } = renderHook(() => useGetSongById("song-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.song?.song_path).toBe("local/path.mp3");
    });
  });

  it("local_で始まるIDの場合はSupabaseを呼ばない", async () => {
    const { result } = renderHook(() => useGetSongById("local_123"), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
