/**
 * @jest-environment jsdom
 */
import { renderHook, act } from "@testing-library/react";
import useAudioPlayer from "@/hooks/audio/useAudioPlayer";
import usePlayer from "@/hooks/player/usePlayer";
import useVolumeStore from "@/hooks/stores/useVolumeStore";
import usePlaybackStateStore from "@/hooks/stores/usePlaybackStateStore";
import { AudioEngine } from "@/libs/audio/AudioEngine";

// Mock stores
jest.mock("@/hooks/player/usePlayer");
jest.mock("@/hooks/stores/useVolumeStore");
jest.mock("@/hooks/stores/usePlaybackStateStore");

// Mock AudioEngine
const mockAudio: {
  paused: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  src: string;
  loop: boolean;
  crossOrigin: string | null;
  play: jest.Mock;
  pause: jest.Mock;
  addEventListener: jest.Mock;
  removeEventListener: jest.Mock;
} = {
  paused: true,
  currentTime: 0,
  duration: 180,
  volume: 1,
  src: "",
  loop: false,
  crossOrigin: null,
  play: jest.fn().mockResolvedValue(undefined),
  pause: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

const mockEngine = {
  audio: mockAudio,
  isInitialized: true,
  initialize: jest.fn(),
  currentSongId: null,
  context: { state: "running" },
  resumeContext: jest.fn().mockResolvedValue(undefined),
};

jest.mock("@/libs/audio/AudioEngine", () => ({
  AudioEngine: {
    getInstance: jest.fn(() => mockEngine),
  },
}));

describe("useAudioPlayer", () => {
  const songUrl = "https://example.com/song.mp3";
  const mockSong = { id: "song-1", title: "Test Song" };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // usePlayerのモックをセレクタ対応にする
    const mockState = {
      activeId: "song-1",
      ids: ["song-1"],
      isRepeating: false,
      isShuffling: false,
      toggleRepeat: jest.fn(),
      toggleShuffle: jest.fn(),
      getNextSongId: jest.fn(),
      getPreviousSongId: jest.fn().mockReturnValue("prev-id"),
      setId: jest.fn(),
    };

    (usePlayer as unknown as jest.Mock).mockImplementation((selector) => {
      return selector ? selector(mockState) : mockState;
    });

    (useVolumeStore as unknown as jest.Mock).mockReturnValue({
      volume: 0.5,
    });

    (usePlaybackStateStore as unknown as jest.Mock).mockReturnValue({
      savePlaybackState: jest.fn(),
      updatePosition: jest.fn(),
      songId: "song-1",
      position: 0,
      hasHydrated: true,
      isRestoring: false,
      setIsRestoring: jest.fn(),
    });

    mockAudio.paused = true;
    mockAudio.src = "";
    mockAudio.currentTime = 0;
    mockEngine.currentSongId = null;
  });

  it("should initialize audio engine if not initialized", () => {
    mockEngine.isInitialized = false;
    renderHook(() => useAudioPlayer(songUrl, mockSong as any));
    expect(mockEngine.initialize).toHaveBeenCalled();
  });

  it("should set audio src and play when isPlaying is toggled", async () => {
    const { result } = renderHook(() => useAudioPlayer(songUrl, mockSong as any));

    expect(mockAudio.src).toBe(songUrl);

    await act(async () => {
      result.current.handlePlay();
    });

    expect(mockAudio.play).toHaveBeenCalled();
  });

  it("should pause audio when handlePlay is toggled again", async () => {
    mockAudio.paused = false;
    const { result } = renderHook(() => useAudioPlayer(songUrl, mockSong as any));

    await act(async () => {
      result.current.handlePlay(); // toggle to false
    });

    expect(mockAudio.pause).toHaveBeenCalled();
  });

  it("should update volume when store changes", () => {
    renderHook(() => useAudioPlayer(songUrl, mockSong as any));
    expect(mockAudio.volume).toBe(0.5);
  });

  it("should seek when handleSeek is called", () => {
    const { result } = renderHook(() => useAudioPlayer(songUrl, mockSong as any));

    act(() => {
      result.current.handleSeek(50);
    });

    expect(mockAudio.currentTime).toBe(50);
  });

  it("should call player.getNextSongId and player.setId when onPlayNext is called", () => {
    const mockSetId = jest.fn();
    const mockGetNext = jest.fn().mockReturnValue("next-id");
    
    const mockState = {
      activeId: "song-1",
      ids: ["song-1"],
      isRepeating: false,
      setId: mockSetId,
      getNextSongId: mockGetNext,
    };

    (usePlayer as unknown as jest.Mock).mockImplementation((selector) => {
      return selector ? selector(mockState) : mockState;
    });

    const { result } = renderHook(() => useAudioPlayer(songUrl, mockSong as any));

    act(() => {
      result.current.onPlayNext();
    });

    expect(mockGetNext).toHaveBeenCalled();
    expect(mockSetId).toHaveBeenCalledWith("next-id");
  });

  it("should call player.getPreviousSongId when onPlayPrevious is called", () => {
    const mockSetId = jest.fn();
    const mockGetPrev = jest.fn().mockReturnValue("prev-id");
    
    const mockState = {
      activeId: "song-1",
      ids: ["song-1"],
      isRepeating: false,
      setId: mockSetId,
      getPreviousSongId: mockGetPrev,
    };

    (usePlayer as unknown as jest.Mock).mockImplementation((selector) => {
      return selector ? selector(mockState) : mockState;
    });

    const { result } = renderHook(() => useAudioPlayer(songUrl, mockSong as any));

    act(() => {
      result.current.onPlayPrevious();
    });

    expect(mockGetPrev).toHaveBeenCalled();
    expect(mockSetId).toHaveBeenCalledWith("prev-id");
  });

  it("should toggle repeat and shuffle", () => {
    const mockToggleRepeat = jest.fn();
    const mockToggleShuffle = jest.fn();
    
    const mockState = {
      activeId: "song-1",
      toggleRepeat: mockToggleRepeat,
      toggleShuffle: mockToggleShuffle,
    };

    (usePlayer as unknown as jest.Mock).mockImplementation((selector) => {
      return selector ? selector(mockState) : mockState;
    });

    const { result } = renderHook(() => useAudioPlayer(songUrl, mockSong as any));

    act(() => {
      result.current.toggleRepeat();
      result.current.toggleShuffle();
    });

    expect(mockToggleRepeat).toHaveBeenCalled();
    expect(mockToggleShuffle).toHaveBeenCalled();
  });

  it("should respond to audio events", () => {
    const { unmount } = renderHook(() => useAudioPlayer(songUrl, mockSong as any));

    // Get the event listeners
    const listeners: Record<string, Function> = {};
    (mockAudio.addEventListener as jest.Mock).mockImplementation((event, cb) => {
      listeners[event] = cb;
    });

    // Re-render to capture listeners
    renderHook(() => useAudioPlayer(songUrl, mockSong as any));

    act(() => {
      if (listeners["play"]) listeners["play"]();
      if (listeners["error"]) listeners["error"](new Error("test"));
    });
    
    expect(mockAudio.pause).toBeDefined();
    unmount();
  });

  it("should not set crossOrigin for badwave:// local URLs", () => {
    const localUrl = "badwave://file/C%3A%5CMusic%5Csong.mp3";
    mockAudio.crossOrigin = null as any;

    renderHook(() => useAudioPlayer(localUrl, mockSong as any));

    expect(mockAudio.crossOrigin).toBeNull();
  });

  it("should set crossOrigin for remote URLs", () => {
    const remoteUrl = "https://example.com/song.mp3";
    mockAudio.crossOrigin = null as any;

    renderHook(() => useAudioPlayer(remoteUrl, mockSong as any));

    expect(mockAudio.crossOrigin).toBe("anonymous");
  });

  it("should handle beforeunload", () => {
    const mockSave = jest.fn();
    (usePlaybackStateStore as unknown as jest.Mock).mockReturnValue({
      savePlaybackState: mockSave,
      updatePosition: jest.fn(),
      hasHydrated: true,
    });

    renderHook(() => useAudioPlayer(songUrl, mockSong as any));

    // Trigger beforeunload
    const event = new Event("beforeunload");
    window.dispatchEvent(event);

    expect(mockSave).toHaveBeenCalled();
  });
});
