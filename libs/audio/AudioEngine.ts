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
  public spatialFilter: BiquadFilterNode | null = null;

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

      // --- ノード作成 ---

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

      // 空間オーディオ用（ダンスホール風）フィルタ
      // LowPassフィルタで高音を削り、こもった音を作る
      this.spatialFilter = this.context.createBiquadFilter();
      this.spatialFilter.type = "lowpass";
      this.spatialFilter.frequency.value = 22050; // デフォルトは全通（エフェクトなし）
      this.spatialFilter.Q.value = 1.0; // 少し共振させて「箱鳴り」感を出す

      // マスターゲインノード
      this.gainNode = this.context.createGain();
      this.gainNode.gain.value = 1;

      // リバーブ用コンボルバーとゲインノード
      this.convolver = this.context.createConvolver();
      this.reverbGainNode = this.context.createGain();
      this.reverbGainNode.gain.value = 0;

      // インパルス応答を生成
      this.setupImpulseResponse();

      // --- 接続 (Routing) ---
      // Main Path: Source -> EQ -> Spatial -> MasterGain -> Dest
      let currentNode: AudioNode = this.sourceNode;

      this.filters.forEach((filter) => {
        currentNode.connect(filter);
        currentNode = filter;
      });

      // Spatial Filter 接続
      currentNode.connect(this.spatialFilter);
      currentNode = this.spatialFilter;

      currentNode.connect(this.gainNode);
      this.gainNode.connect(this.context.destination);

      // Reverb Path: (After effects) -> ReverbGain -> Convolver -> Dest
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

  /**
   * リバーブ量 (Wet/Dry の Wet成分) を設定 (0.0 - 1.0)
   */
  public setReverbGain(value: number): void {
    if (this.reverbGainNode) {
      // 0.0 ~ 1.0 の値を適切なゲイン幅にマッピング
      // リバーブが強すぎないように調整 (Max 0.5程度にするなど)
      this.reverbGainNode.gain.value = Math.max(0, Math.min(value, 2.0));
    }
  }

  /**
   * 空間オーディオ（Spatial Mode）の有効/無効切り替え
   * LowPassフィルタでこもらせ、リバーブで広がりを出す（ダンスホール風）
   */
  public setSpatialMode(enabled: boolean): void {
    if (!this.spatialFilter) return;

    const now = this.context?.currentTime || 0;

    // パラメータを滑らかに変化させる
    if (enabled) {
      // ON: 800Hz以上をカット（こもらせる）、リバーブを深めに (0.8)
      // expRampを使うときは0に向かえないので、targetが0でないことを確認
      this.spatialFilter.frequency.exponentialRampToValueAtTime(800, now + 0.2);
      this.setReverbGain(0.8);
    } else {
      // OFF: 22050Hz (全通)、リバーブ 0
      this.spatialFilter.frequency.exponentialRampToValueAtTime(
        22050,
        now + 0.2
      );
      // setSpatialMode は Spatial機能専用。呼び出し元で isSlowedReverb との調停を行う。
      this.setReverbGain(0);
    }
  }

  /**
   * 低速+リバーブモードの設定
   */
  public setSlowedReverbMode(enabled: boolean): void {
    // リバーブだけ有効にする（Spatialとは別に管理）
    // 両方ONの場合は、呼び出し元フックで高い方を優先するロジックにする
    if (enabled) {
      this.setReverbGain(0.6); // 少し深め
    } else {
      this.setReverbGain(0);
    }
  }
}

export { AudioEngine };
