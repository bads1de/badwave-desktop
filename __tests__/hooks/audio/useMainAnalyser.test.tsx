/**
 * @jest-environment jsdom
 */
import { renderHook, act } from "@testing-library/react";
import useMainAnalyser from "@/hooks/audio/useMainAnalyser";

// AudioEngine のモック
const mockAnalyser = { fftSize: 0, smoothingTimeConstant: 0 };
const mockAudio = {
  paused: true,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};
const mockEngine = {
  isInitialized: false,
  analyser: mockAnalyser,
  audio: mockAudio,
  initialize: jest.fn(),
};

jest.mock("@/libs/audio/AudioEngine", () => ({
  AudioEngine: {
    getInstance: jest.fn(() => mockEngine),
  },
}));

describe("useMainAnalyser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEngine.isInitialized = false;
    mockAudio.paused = true;
    mockAudio.addEventListener.mockClear();
    mockAudio.removeEventListener.mockClear();
  });

  it("should initialize AudioEngine if not initialized", () => {
    renderHook(() => useMainAnalyser());
    expect(mockEngine.initialize).toHaveBeenCalled();
  });

  it("should not initialize AudioEngine if already initialized", () => {
    mockEngine.isInitialized = true;
    renderHook(() => useMainAnalyser());
    expect(mockEngine.initialize).not.toHaveBeenCalled();
  });

  it("should return the analyser from AudioEngine", () => {
    const { result } = renderHook(() => useMainAnalyser());
    expect(result.current.analyser).toBe(mockAnalyser);
  });

  it("should return isPlaying=false when audio is paused", () => {
    mockAudio.paused = true;
    const { result } = renderHook(() => useMainAnalyser());
    expect(result.current.isPlaying).toBe(false);
  });

  it("should return isPlaying=true when audio is playing", () => {
    mockAudio.paused = false;
    const { result } = renderHook(() => useMainAnalyser());
    expect(result.current.isPlaying).toBe(true);
  });

  it("should register play/pause/ended event listeners", () => {
    renderHook(() => useMainAnalyser());

    const addCalls = mockAudio.addEventListener.mock.calls;
    const eventTypes = addCalls.map((call: any[]) => call[0]);

    expect(eventTypes).toContain("play");
    expect(eventTypes).toContain("pause");
    expect(eventTypes).toContain("ended");
  });

  it("should update isPlaying when play event fires", () => {
    const { result } = renderHook(() => useMainAnalyser());

    // play イベントハンドラを取得
    const playCall = mockAudio.addEventListener.mock.calls.find(
      (call: any[]) => call[0] === "play"
    );
    const playHandler = playCall![1] as () => void;

    act(() => {
      playHandler();
    });

    expect(result.current.isPlaying).toBe(true);
  });

  it("should update isPlaying when pause event fires", () => {
    mockAudio.paused = false;
    const { result } = renderHook(() => useMainAnalyser());

    // pause イベントハンドラを取得
    const pauseCall = mockAudio.addEventListener.mock.calls.find(
      (call: any[]) => call[0] === "pause"
    );
    const pauseHandler = pauseCall![1] as () => void;

    act(() => {
      pauseHandler();
    });

    expect(result.current.isPlaying).toBe(false);
  });

  it("should update isPlaying when ended event fires", () => {
    const { result } = renderHook(() => useMainAnalyser());

    // ended イベントハンドラを取得
    const endedCall = mockAudio.addEventListener.mock.calls.find(
      (call: any[]) => call[0] === "ended"
    );
    const endedHandler = endedCall![1] as () => void;

    act(() => {
      endedHandler();
    });

    expect(result.current.isPlaying).toBe(false);
  });

  it("should cleanup event listeners on unmount", () => {
    const { unmount } = renderHook(() => useMainAnalyser());

    unmount();

    const removeCalls = mockAudio.removeEventListener.mock.calls;
    const eventTypes = removeCalls.map((call: any[]) => call[0]);

    expect(eventTypes).toContain("play");
    expect(eventTypes).toContain("pause");
    expect(eventTypes).toContain("ended");
  });

  it("should return null analyser if AudioEngine has no analyser", () => {
    mockEngine.analyser = null as unknown as typeof mockAnalyser;
    const { result } = renderHook(() => useMainAnalyser());
    expect(result.current.analyser).toBeNull();
  });
});
