import { EQ_BANDS } from "@/hooks/stores/useEqualizerStore";

/**
 * オーディオ要素とWeb Audio APIノードを管理するシングルトン
 * Reactのライフサイクル外で永続化し、ページ遷移でも再生を継続する
 */
class AudioEngine {
  private static instance: AudioEngine | null = null;

  // Audio要素
  public audio: HTMLAudioElement | null = null;

  // Web Audio API ノード
  public context: AudioContext | null = null;
  public sourceNode: MediaElementAudioSourceNode | null = null;
  public filters: BiquadFilterNode[] = [];
  public gainNode: GainNode | null = null;
  public reverbGainNode: GainNode | null = null;
  public convolver: ConvolverNode | null = null;

  // 状態管理
  public currentSongId: string | null = null;
  public isInitialized = false;

  private constructor() {
    // ブラウザ環境でのみ audio 要素を作成
    if (typeof window !== "undefined") {
      this.audio = new Audio();
      this.audio.crossOrigin = "anonymous";
    }
  }

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  /**
   * Web Audio API グラフを初期化（イコライザー、リバーブ含む）
   * 一度だけ呼ばれる
   */
  public initialize(): void {
    if (!this.audio || this.isInitialized) return;

    try {
      this.context = new AudioContext();
      this.sourceNode = this.context.createMediaElementSource(this.audio);

      // 6バンドイコライザーフィルターを作成
      this.filters = EQ_BANDS.map((band, index) => {
        const filter = this.context!.createBiquadFilter();
        if (index === 0) {
          filter.type = "lowshelf";
        } else if (index === EQ_BANDS.length - 1) {
          filter.type = "highshelf";
        } else {
          filter.type = "peaking";
          filter.Q.value = 1.4;
        }
        filter.frequency.value = band.freq;
        filter.gain.value = 0;
        return filter;
      });

      // マスターゲインノード
      this.gainNode = this.context.createGain();
      this.gainNode.gain.value = 1;

      // リバーブ用コンボルバーとゲインノード
      this.convolver = this.context.createConvolver();
      this.reverbGainNode = this.context.createGain();
      this.reverbGainNode.gain.value = 0;

      // インパルス応答を生成
      this.setupImpulseResponse();

      // ノード接続: source -> filters -> gain -> destination
      let currentNode: AudioNode = this.sourceNode;
      this.filters.forEach((filter) => {
        currentNode.connect(filter);
        currentNode = filter;
      });
      currentNode.connect(this.gainNode);
      this.gainNode.connect(this.context.destination);

      // リバーブ接続: lastFilter -> reverbGain -> convolver -> destination
      currentNode.connect(this.reverbGainNode);
      this.reverbGainNode.connect(this.convolver);
      this.convolver.connect(this.context.destination);

      this.isInitialized = true;
      console.log("[AudioEngine] Initialized successfully");
    } catch (error) {
      console.error("[AudioEngine] Initialization failed:", error);
    }
  }

  private setupImpulseResponse(): void {
    if (!this.context || !this.convolver) return;

    const sampleRate = this.context.sampleRate;
    const length = sampleRate * 3;
    const impulse = this.context.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const decay = Math.pow((length - i) / length, 2);
      left[i] = (Math.random() * 2 - 1) * decay;
      right[i] = (Math.random() * 2 - 1) * decay;
    }

    this.convolver.buffer = impulse;
  }

  /**
   * AudioContextをresumeする（ユーザー操作後に呼ぶ）
   */
  public async resumeContext(): Promise<void> {
    if (this.context && this.context.state === "suspended") {
      await this.context.resume();
    }
  }
}

export { AudioEngine };
