import { renderHook, act, waitFor } from "@testing-library/react";
import useAudioEqualizer from "@/hooks/audio/useAudioEqualizer";
import usePlaybackRateStore from "@/hooks/stores/usePlaybackRateStore";
import useEqualizerStore from "@/hooks/stores/useEqualizerStore";

// Web Audio API Mocking
const mockGainNode = {
  gain: {
    value: 1,
    setTargetAtTime: jest.fn(),
  },
  connect: jest.fn(),
  disconnect: jest.fn(),
};

const mockBiquadFilterNode = {
  gain: { value: 0 },
  frequency: { value: 0 },
  Q: { value: 0 },
  connect: jest.fn(),
  disconnect: jest.fn(),
};

const mockConvolverNode = {
  buffer: null,
  connect: jest.fn(),
  disconnect: jest.fn(),
};

const mockAudioContext = {
  createMediaElementSource: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
  })),
  createBiquadFilter: jest.fn(() => ({ ...mockBiquadFilterNode })),
  createGain: jest.fn(() => ({
    gain: { value: 1, setTargetAtTime: jest.fn() },
    connect: jest.fn(),
    disconnect: jest.fn(),
  })),
  createConvolver: jest.fn(() => ({ ...mockConvolverNode })),
  createBuffer: jest.fn(() => ({
    getChannelData: jest.fn(() => new Float32Array(100)),
  })),
  destination: {},
  sampleRate: 44100,
  currentTime: 0,
  close: jest.fn(),
};

const AudioContextMock = jest.fn(() => mockAudioContext);
(global as any).AudioContext = AudioContextMock;

describe("useAudioEqualizer Reverb Bug Reproduction", () => {
  let audioElement: HTMLAudioElement;
  let audioRef: { current: HTMLAudioElement };

  beforeEach(() => {
    jest.clearAllMocks();
    usePlaybackRateStore.getState().setIsSlowedReverb(false);
    useEqualizerStore.getState().reset();

    audioElement = document.createElement("audio");
    // Mock readyState to trigger initialization
    Object.defineProperty(audioElement, "readyState", {
      get: () => 4,
      configurable: true,
    });
    audioRef = { current: audioElement };
  });

  it("should initialize reverb gain to 0 if isSlowedReverb is false", async () => {
    const { result } = renderHook(() => useAudioEqualizer(audioRef as any));

    // Wait for initialization
    await waitFor(() => expect(result.current.isInitialized).toBe(true));

    // Get the reverb gain node from the mock calls
    // createGain is called for:
    // 1. master gain (line 59)
    // 2. reverb gain (line 73)

    const createGainCalls = (mockAudioContext.createGain as jest.Mock).mock
      .results;
    expect(createGainCalls.length).toBeGreaterThanOrEqual(2);

    const reverbGainNode = createGainCalls[1].value;

    // BUG: If it's 1, it matches the user's report
    // EXPECTATION: Should be 0
    expect(reverbGainNode.gain.value).toBe(0);
  });

  it("should initialize reverb gain to 0.4 if isSlowedReverb is true", async () => {
    usePlaybackRateStore.getState().setIsSlowedReverb(true);

    const { result } = renderHook(() => useAudioEqualizer(audioRef as any));

    await waitFor(() => expect(result.current.isInitialized).toBe(true));

    const createGainCalls = (mockAudioContext.createGain as jest.Mock).mock
      .results;
    const reverbGainNode = createGainCalls[1].value;

    expect(reverbGainNode.gain.value).toBe(0.4);
  });
});
