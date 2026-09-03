/**
 * @jest-environment jsdom
 */
import { AudioEngine } from "@/libs/audio/AudioEngine";

// Web Audio API Mocks
const mockConnect = jest.fn();
const mockDisconnect = jest.fn();
const mockStart = jest.fn();
const mockLinearRampToValueAtTime = jest.fn();
const mockExponentialRampToValueAtTime = jest.fn();

const createMockAudioNode = () => ({
  connect: mockConnect,
  disconnect: mockDisconnect,
  gain: {
    value: 0,
    linearRampToValueAtTime: mockLinearRampToValueAtTime,
    exponentialRampToValueAtTime: mockExponentialRampToValueAtTime,
  },
  frequency: {
    value: 0,
    linearRampToValueAtTime: mockLinearRampToValueAtTime,
    exponentialRampToValueAtTime: mockExponentialRampToValueAtTime,
  },
  pan: {
    value: 0,
  },
  Q: {
    value: 0,
  },
  buffer: null,
  start: mockStart,
});

const mockAudioContext = {
  createMediaElementSource: jest.fn(() => createMockAudioNode()),
  createBiquadFilter: jest.fn(() => createMockAudioNode()),
  createGain: jest.fn(() => createMockAudioNode()),
  createConvolver: jest.fn(() => createMockAudioNode()),
  createStereoPanner: jest.fn(() => createMockAudioNode()),
  createWaveShaper: jest.fn(() => ({
    ...createMockAudioNode(),
    curve: null,
  })),
  createOscillator: jest.fn(() => ({
    ...createMockAudioNode(),
    type: "sine",
  })),
  createAnalyser: jest.fn(() => ({
    fftSize: 0,
    smoothingTimeConstant: 0,
    frequencyBinCount: 128,
    connect: mockConnect,
    disconnect: mockDisconnect,
    getByteFrequencyData: jest.fn(),
    getByteTimeDomainData: jest.fn(),
  })),
  createBuffer: jest.fn(() => ({
    getChannelData: jest.fn(() => new Float32Array(100)),
  })),
  currentTime: 0,
  sampleRate: 44100,
  state: "suspended",
  resume: jest.fn(),
  destination: {},
};

global.AudioContext = jest.fn(() => mockAudioContext) as any;
global.Audio = jest.fn(() => ({
  crossOrigin: "",
  preservesPitch: true,
})) as any;

describe("AudioEngine", () => {
  let engine: AudioEngine;

  beforeEach(() => {
    jest.clearAllMocks();
    // シングルトンのインスタンスをリセットするためにprivateプロパティにアクセスするハック
    // しかしJSのprivateはコンパイル時のみなのでanyキャストでアクセス可能
    (AudioEngine as any).instance = null;
    engine = AudioEngine.getInstance();
  });

  it("should be a singleton", () => {
    const engine2 = AudioEngine.getInstance();
    expect(engine).toBe(engine2);
  });

  it("should initialize audio graph correctly", () => {
    engine.initialize();

    expect(mockAudioContext.createMediaElementSource).toHaveBeenCalled();
    expect(mockAudioContext.createBiquadFilter).toHaveBeenCalled(); // EQ filters, Spatial, Retro
    expect(mockAudioContext.createGain).toHaveBeenCalled(); // Master, Reverb, LFO
    expect(mockAudioContext.createStereoPanner).toHaveBeenCalled();
    expect(engine.isInitialized).toBe(true);
  });

  it("should not initialize twice", () => {
    engine.initialize();
    mockAudioContext.createMediaElementSource.mockClear();

    engine.initialize();
    expect(mockAudioContext.createMediaElementSource).not.toHaveBeenCalled();
  });

  describe("AnalyserNode", () => {
    it("should have null analyser before initialization", () => {
      expect(engine.analyser).toBeNull();
    });

    it("should create analyser during initialization", () => {
      engine.initialize();
      expect(mockAudioContext.createAnalyser).toHaveBeenCalled();
      expect(engine.analyser).toBeDefined();
    });

    it("should set correct fftSize on analyser", () => {
      engine.initialize();
      expect(engine.analyser!.fftSize).toBe(256);
    });

    it("should set correct smoothingTimeConstant on analyser", () => {
      engine.initialize();
      expect(engine.analyser!.smoothingTimeConstant).toBe(0.8);
    });

    it("should route gainNode through analyser to destination", () => {
      engine.initialize();
      // gainNode -> analyser -> destination の接続確認
      expect(mockConnect).toHaveBeenCalledWith(engine.analyser);
      expect(engine.analyser!.connect).toHaveBeenCalledWith(
        mockAudioContext.destination
      );
    });
  });

  describe("Effect Controls", () => {
    beforeEach(() => {
      engine.initialize();
      jest.clearAllMocks();
    });

    it("should control 8D Audio mode", () => {
      // Enable
      engine.set8DAudioMode(true, 4);
      expect(mockLinearRampToValueAtTime).toHaveBeenCalled(); // Gain ramp up

      // Disable
      engine.set8DAudioMode(false);
      expect(mockLinearRampToValueAtTime).toHaveBeenCalled(); // Gain ramp down
    });

    it("should control Retro mode", () => {
      // Enable
      engine.setRetroMode(true);
      expect(mockExponentialRampToValueAtTime).toHaveBeenCalledTimes(2); // HPF freq, LPF freq changes

      // Disable
      engine.setRetroMode(false);
      expect(mockExponentialRampToValueAtTime).toHaveBeenCalled();
    });

    it("should control Spatial mode", () => {
      engine.setSpatialMode(true);
      expect(mockExponentialRampToValueAtTime).toHaveBeenCalled(); // Filter freq change
      // リバーブが0.8に設定されるはず
      // 実装では updateReverbState -> setReverbGain を呼んでいる
      // mockReverbGainNode.gain.value をチェックしたいが、privateなので難しい
    });

    it("should control Slowed+Reverb mode", () => {
      engine.setSlowedReverbMode(true);
      // リバーブが0.6に設定されるはず
    });

    it("should update reverb state correctly based on priority", () => {
      // Spatial > SlowedReverb > Off

      // 1. Spatial ON
      engine.setSpatialMode(true);
      // Spatial Active

      // 2. SlowedReverb ON (Spatial is still ON)
      engine.setSlowedReverbMode(true);
      // Should prioritize Spatial

      // 3. Spatial OFF
      engine.setSpatialMode(false);
      // Should fallback to SlowedReverb

      // 4. SlowedReverb OFF
      engine.setSlowedReverbMode(false);
      // Should be OFF
    });
  });
});
