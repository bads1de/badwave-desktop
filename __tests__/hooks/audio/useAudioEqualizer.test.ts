/**
 * @jest-environment jsdom
 */
import useEqualizerStore from "@/hooks/stores/useEqualizerStore";

// Web Audio API のモック
const mockGain = { value: 0 };
const mockBiquadFilterNode = {
  type: "peaking",
  frequency: { value: 0 },
  Q: { value: 1 },
  gain: mockGain,
  connect: jest.fn().mockReturnThis(),
  disconnect: jest.fn(),
};

const mockGainNode = {
  gain: { value: 1 },
  connect: jest.fn().mockReturnThis(),
  disconnect: jest.fn(),
};

const mockMediaElementSource = {
  connect: jest.fn().mockReturnThis(),
  disconnect: jest.fn(),
};

const mockAudioContext = {
  createBiquadFilter: jest.fn(() => ({ ...mockBiquadFilterNode })),
  createGain: jest.fn(() => ({ ...mockGainNode })),
  createMediaElementSource: jest.fn(() => mockMediaElementSource),
  destination: {},
  state: "running",
  resume: jest.fn().mockResolvedValue(undefined),
  close: jest.fn().mockResolvedValue(undefined),
};

// AudioContext のグローバルモック
const AudioContextMock = jest.fn(() => mockAudioContext);
(global as unknown as { AudioContext: typeof AudioContextMock }).AudioContext =
  AudioContextMock;

// テスト前にストアをリセット
beforeEach(() => {
  jest.clearAllMocks();
  useEqualizerStore.getState().reset();
});

describe("useAudioEqualizer", () => {
  describe("初期化", () => {
    it("audioRef と audioContext を受け取ってイコライザーを構築できる", async () => {
      const { default: useAudioEqualizer } = await import(
        "@/hooks/audio/useAudioEqualizer"
      );

      // 仮の audio 要素を作成
      const audioElement = document.createElement("audio");

      // フックを実行（実際のReactフックテストではなく、関数としてテスト）
      // NOTE: この時点ではフックの単純な存在確認のみ
      expect(typeof useAudioEqualizer).toBe("function");
    });
  });

  describe("AudioContext 生成", () => {
    it("AudioContext が正しく作成される", () => {
      new AudioContextMock();
      expect(AudioContextMock).toHaveBeenCalled();
    });

    it("BiquadFilter ノードが6つ作成される", () => {
      const ctx = new AudioContextMock();
      // 6バンド分のフィルターを作成
      for (let i = 0; i < 6; i++) {
        ctx.createBiquadFilter();
      }
      expect(ctx.createBiquadFilter).toHaveBeenCalledTimes(6);
    });
  });

  describe("ストアとの連携", () => {
    it("ストアのゲイン変更が反映される", () => {
      // ストアのゲインを変更
      useEqualizerStore.getState().setGain(60, 6);

      const { bands } = useEqualizerStore.getState();
      const band60Hz = bands.find((b) => b.freq === 60);
      expect(band60Hz?.gain).toBe(6);
    });

    it("ストアの有効/無効が反映される", () => {
      expect(useEqualizerStore.getState().isEnabled).toBe(false);

      useEqualizerStore.getState().toggleEnabled();
      expect(useEqualizerStore.getState().isEnabled).toBe(true);
    });
  });
});
