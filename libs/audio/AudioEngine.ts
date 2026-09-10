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
  private isSpatialActive = false;
  private isSlowedReverbActive = false;

  // 8D Audio ノード
  public stereoPanner: StereoPannerNode | null = null;
  private lfoOscillator: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  private is8DAudioActive = false;

  // Retro ノード
  public retroLowPass: BiquadFilterNode | null = null;
  public retroHighPass: BiquadFilterNode | null = null;
  public distortionNode: WaveShaperNode | null = null;
  private isRetroActive = false;

  // Bass Boost ノード
  public bassBoostFilter: BiquadFilterNode | null = null;
  private isBassBoostActive = false;

  // Analyser ノード（ビジュアライザー用）
  public analyser: AnalyserNode | null = null;

  // 状態管理
  public currentSongId: string | null = null;
  public isInitialized = false;

  private constructor() {
    // ブラウザ環境でのみ audio 要素を作成
    if (typeof window !== "undefined") {
      this.audio = new Audio();
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

      // --- 8D Audio ノード作成 ---
      this.stereoPanner = this.context.createStereoPanner();
      this.stereoPanner.pan.value = 0; // 中央から開始

      // LFO (Low Frequency Oscillator) でパン値を自動制御
      this.lfoOscillator = this.context.createOscillator();
      this.lfoOscillator.type = "sine";
      this.lfoOscillator.frequency.value = 0.25; // 4秒で1周（デフォルト）

      this.lfoGain = this.context.createGain();
      this.lfoGain.gain.value = 0; // 初期はOFF（8D無効）

      // LFO -> LFOGain -> StereoPanner.pan
      this.lfoOscillator.connect(this.lfoGain);
      this.lfoGain.connect(this.stereoPanner.pan);
      this.lfoOscillator.start();

      // --- Retro ノード作成 ---
      // High Pass: 低音を削る
      this.retroHighPass = this.context.createBiquadFilter();
      this.retroHighPass.type = "highpass";
      this.retroHighPass.frequency.value = 0; // 初期は全通（0Hz）
      this.retroHighPass.Q.value = 0.5;

      // Low Pass (High Cut): 高音を削る
      this.retroLowPass = this.context.createBiquadFilter();
      this.retroLowPass.type = "lowpass";
      this.retroLowPass.frequency.value = 22050; // 初期は全通
      this.retroLowPass.Q.value = 0.5;

      // Distortion (WaveShaper): 歪みを追加
      this.distortionNode = this.context.createWaveShaper();
      this.distortionNode.oversample = "4x";

      // --- Bass Boost ノード作成 ---
      this.bassBoostFilter = this.context.createBiquadFilter();
      this.bassBoostFilter.type = "lowshelf";
      this.bassBoostFilter.frequency.value = 100; // 100Hzを中心に
      this.bassBoostFilter.gain.value = 0; // 初期はOFF (0dB)

      // --- Analyser ノード作成（ビジュアライザー用） ---
      this.analyser = this.context.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;

      // --- 接続 (Routing) ---
      // Main Path: Source -> EQ -> Spatial -> 8D Panner -> Retro(HighPass->LowPass->Distortion) -> MasterGain -> Dest
      let currentNode: AudioNode = this.sourceNode;

      this.filters.forEach((filter) => {
        currentNode.connect(filter);
        currentNode = filter;
      });

      // Spatial Filter 接続
      currentNode.connect(this.spatialFilter);
      currentNode = this.spatialFilter;

      // 8D Audio Panner 接続
      currentNode.connect(this.stereoPanner);
      currentNode = this.stereoPanner;

      // Retro Filters 接続 (HighPass -> LowPass -> Distortion)
      currentNode.connect(this.retroHighPass);
      this.retroHighPass.connect(this.retroLowPass);
      currentNode = this.retroLowPass;

      // Distortion 接続
      currentNode.connect(this.distortionNode);
      currentNode = this.distortionNode;

      // Bass Boost 接続
      currentNode.connect(this.bassBoostFilter);
      currentNode = this.bassBoostFilter;

      currentNode.connect(this.gainNode);
      this.gainNode.connect(this.analyser);
      this.analyser.connect(this.context.destination);

      // Reverb Path: (After effects) -> ReverbGain -> Convolver -> Dest
      this.stereoPanner.connect(this.reverbGainNode);
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
   * ディストーションカーブを生成
   * amount: 0 ~ 100+ (大きいほど歪む)
   */
  private makeDistortionCurve(amount: number): Float32Array<ArrayBuffer> {
    const k = typeof amount === "number" ? amount : 50;
    const n_samples = 44100;
    // WaveShaperNode expects a Float32Array backed by an ArrayBuffer.
    const curve = new Float32Array(
      new ArrayBuffer(n_samples * Float32Array.BYTES_PER_ELEMENT),
    );
    const deg = Math.PI / 180;

    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
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
   * ※直接呼び出すのではなく、updateReverbState経由で使用する
   */
  public setReverbGain(value: number): void {
    if (this.reverbGainNode) {
      this.reverbGainNode.gain.value = Math.max(0, Math.min(value, 2.0));
    }
  }

  /**
   * 現在のアクティブなモードに基づいてリバーブゲインを更新
   * 優先度: Spatial > SlowedReverb
   */
  private updateReverbState(): void {
    if (this.isSpatialActive) {
      this.setReverbGain(0.8);
    } else if (this.isSlowedReverbActive) {
      this.setReverbGain(0.6);
    } else {
      this.setReverbGain(0);
    }
  }

  /**
   * 空間オーディオ（Spatial Mode）の有効/無効切り替え
   */
  public setSpatialMode(enabled: boolean): void {
    if (!this.spatialFilter) return;

    const now = this.context?.currentTime || 0;
    this.isSpatialActive = enabled;

    if (enabled) {
      // ON: 800Hz以上をカット（こもらせる）
      this.spatialFilter.frequency.exponentialRampToValueAtTime(800, now + 0.2);
    } else {
      // OFF: 22050Hz (全通)
      this.spatialFilter.frequency.exponentialRampToValueAtTime(
        22050,
        now + 0.2,
      );
    }

    // リバーブ状態を更新
    this.updateReverbState();
  }

  /**
   * 低速+リバーブモードの設定
   */
  public setSlowedReverbMode(enabled: boolean): void {
    this.isSlowedReverbActive = enabled;
    this.updateReverbState();
  }

  /**
   * ピッチ補正（preservesPitch）の設定
   * true: 速度を変えても音程を維持する（通常）
   * false: 速度を変えると音程も変わる（テープ再生風、Slowed+Reverb用）
   */
  public setPreservesPitch(preserve: boolean): void {
    if (!this.audio) return;

    this.audio.preservesPitch = preserve;
    // クロスブラウザ対応
    const audio = this.audio as HTMLAudioElement & {
      mozPreservesPitch?: boolean;
      webkitPreservesPitch?: boolean;
    };
    audio.mozPreservesPitch = preserve;
    audio.webkitPreservesPitch = preserve;
  }

  // ========================================
  // 8D Audio
  // ========================================

  /**
   * 8D Audio（自動パンニング）の有効/無効を切り替え
   * @param enabled 有効にするかどうか
   * @param rotationPeriod 1周にかかる秒数（デフォルト4秒）
   */
  public set8DAudioMode(enabled: boolean, rotationPeriod = 4): void {
    if (!this.lfoGain || !this.lfoOscillator) return;

    const now = this.context?.currentTime || 0;

    if (enabled) {
      // LFOゲインを1にして回転を有効化
      this.lfoGain.gain.linearRampToValueAtTime(1, now + 0.3);
      // 回転速度を設定
      this.lfoOscillator.frequency.value = 1 / rotationPeriod;
      this.is8DAudioActive = true;
    } else {
      // LFOゲインを0にして回転を停止
      this.lfoGain.gain.linearRampToValueAtTime(0, now + 0.3);
      this.is8DAudioActive = false;
    }
  }

  /**
   * 8D Audioの回転速度を変更（有効時のみ効果あり）
   * @param rotationPeriod 1周にかかる秒数
   */
  public set8DRotationSpeed(rotationPeriod: number): void {
    if (!this.lfoOscillator || !this.is8DAudioActive) return;

    // 周波数 = 1 / 周期（秒）
    const frequency = 1 / rotationPeriod;
    const now = this.context?.currentTime || 0;
    this.lfoOscillator.frequency.linearRampToValueAtTime(frequency, now + 0.1);
  }

  // ========================================
  // Retro Mode (Old: Lo-Fi/Vintage)
  // ========================================

  /**
   * Retro モードの有効/無効を切り替え
   * 80年代カセットテープ / 32kbps風の劣化サウンド
   */
  public setRetroMode(enabled: boolean): void {
    if (
      !this.retroLowPass ||
      !this.retroHighPass ||
      !this.distortionNode ||
      !this.context
    ) {
      return;
    }

    const now = this.context.currentTime;

    if (enabled) {
      // 32kbps m4a / 80年代ラジカセ風（歪み + 帯域制限）

      // HighPass: 400Hz以下をカット (こもらせる)
      this.retroHighPass.frequency.exponentialRampToValueAtTime(400, now + 0.3);
      this.retroHighPass.Q.value = 1.0;

      // LowPass: 2500Hz以上をカット (AMラジオ/電話のような狭帯域)
      this.retroLowPass.frequency.exponentialRampToValueAtTime(2500, now + 0.3);
      this.retroLowPass.Q.value = 1.0;

      // Distortion: 音割れを防ぐため大幅に低減 (ほぼ隠し味/サチュレーション程度)
      // amount=10 くらいで歪み感を抑える
      this.distortionNode.curve = this.makeDistortionCurve(10);

      this.isRetroActive = true;
    } else {
      // フィルターを全通に戻す
      // HighPass -> 10Hz (0にはできないため低い値)
      this.retroHighPass.frequency.exponentialRampToValueAtTime(10, now + 0.3);
      this.retroHighPass.Q.value = 0.5;

      // LowPass -> 22050Hz
      this.retroLowPass.frequency.exponentialRampToValueAtTime(
        22050,
        now + 0.3,
      );
      this.retroLowPass.Q.value = 0.5;

      // Distortion解除
      this.distortionNode.curve = null;

      this.isRetroActive = false;
    }
  }

  // ========================================
  // Bass Boost
  // ========================================

  /**
   * Bass Boost の有効/無効を切り替え
   * 低域を+9dBブーストして迫力のあるサウンドに
   */
  public setBassBoostMode(enabled: boolean): void {
    if (!this.bassBoostFilter || !this.context) return;

    const now = this.context.currentTime;

    if (enabled) {
      // +9dB の重低音ブースト
      this.bassBoostFilter.gain.linearRampToValueAtTime(9, now + 0.2);
      this.isBassBoostActive = true;
    } else {
      // 0dB に戻す
      this.bassBoostFilter.gain.linearRampToValueAtTime(0, now + 0.2);
      this.isBassBoostActive = false;
    }
  }
}

export { AudioEngine };
