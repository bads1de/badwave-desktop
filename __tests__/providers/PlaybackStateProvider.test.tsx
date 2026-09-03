/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, act } from "@testing-library/react";
import PlaybackStateProvider from "@/providers/PlaybackStateProvider";
import usePlayer from "@/hooks/player/usePlayer";
import usePlaybackStateStore from "@/hooks/stores/usePlaybackStateStore";

// Mock hooks — usePlayer needs getState() for zustand store static method
jest.mock("@/hooks/player/usePlayer", () => {
  const mockFn = jest.fn();
  (mockFn as any).getState = jest.fn();
  return { __esModule: true, default: mockFn };
});
jest.mock("@/hooks/stores/usePlaybackStateStore");

// filterStaleLocalSongs をモック（非同期処理を同期的に扱う）
const mockFilterStaleLocalSongs = jest.fn((ids: string[]) => Promise.resolve(ids));
jest.mock("@/libs/electron/files", () => ({
  filterStaleLocalSongs: (...args: [string[]]) => mockFilterStaleLocalSongs(...args),
  checkLocalFileExists: jest.fn(),
}));

describe("PlaybackStateProvider", () => {
  const mockSetIds = jest.fn();
  const mockSetId = jest.fn();
  const mockSetIsRestoring = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    const playerState = {
      setIds: mockSetIds,
      setId: mockSetId,
      localSongs: new Map<string, string>(),
    };

    (usePlayer as unknown as jest.Mock).mockReturnValue(playerState);
    (usePlayer as any).getState.mockReturnValue(playerState);

    (usePlaybackStateStore as unknown as jest.Mock).mockReturnValue({
      songId: "song-1",
      playlist: ["song-1", "song-2"],
      hasHydrated: true,
      setIsRestoring: mockSetIsRestoring,
    });
  });

  it("should restore playback state when hydrated and songId exists", async () => {
    await act(async () => {
      render(
        <PlaybackStateProvider>
          <div>Child</div>
        </PlaybackStateProvider>
      );
    });

    expect(mockSetIsRestoring).toHaveBeenCalledWith(true);
    expect(mockSetIds).toHaveBeenCalledWith(["song-1", "song-2"]);
    expect(mockSetId).toHaveBeenCalledWith("song-1");
  });

  it("should not restore if not hydrated", () => {
    (usePlaybackStateStore as unknown as jest.Mock).mockReturnValue({
      songId: "song-1",
      playlist: ["song-1", "song-2"],
      hasHydrated: false,
      setIsRestoring: mockSetIsRestoring,
    });

    render(
      <PlaybackStateProvider>
        <div>Child</div>
      </PlaybackStateProvider>
    );

    expect(mockSetId).not.toHaveBeenCalled();
  });

  it("should not restore if no saved songId", () => {
    (usePlaybackStateStore as unknown as jest.Mock).mockReturnValue({
      songId: null,
      playlist: [],
      hasHydrated: true,
      setIsRestoring: mockSetIsRestoring,
    });

    render(
      <PlaybackStateProvider>
        <div>Child</div>
      </PlaybackStateProvider>
    );

    expect(mockSetId).not.toHaveBeenCalled();
  });

  it("should fall back to original playlist when filterStaleLocalSongs fails", async () => {
    mockFilterStaleLocalSongs.mockRejectedValueOnce(new Error("IPC failed"));

    await act(async () => {
      render(
        <PlaybackStateProvider>
          <div>Child</div>
        </PlaybackStateProvider>
      );
    });

    // フォールバック：元のプレイリストで復元
    expect(mockSetIds).toHaveBeenCalledWith(["song-1", "song-2"]);
    expect(mockSetId).toHaveBeenCalledWith("song-1");
  });
});
