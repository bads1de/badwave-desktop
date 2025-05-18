import { create } from "zustand";

interface AudioWaveState {
  audioContext: AudioContext | null;
  analyser: AnalyserNode | null;
  audioElement: HTMLAudioElement | null;
  source: MediaElementAudioSourceNode | null;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  currentSongId: string | null;
  audioUrl: string | null;
  isEnded: boolean;
  initializeAudio: (audioUrl: string, songId: string) => Promise<void>;
  play: () => Promise<void>;
  pause: () => void;
  seek: (time: number) => void;
  cleanup: () => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setIsEnded: (isEnded: boolean) => void;
}

/**
 * オーディオ波形データを管理するカスタムフック
 *
 * @returns {Object} オーディオ波形の状態と操作関数
 * @property {AudioContext|null} audioContext - Web Audio APIのコンテキスト
 * @property {AnalyserNode|null} analyser - オーディオ分析用ノード
 * @property {HTMLAudioElement|null} audioElement - オーディオ要素
 * @property {MediaElementAudioSourceNode|null} source - メディアソースノード
 * @property {number} currentTime - 現在の再生時間（秒）
 * @property {number} duration - 曲の長さ（秒）
 * @property {boolean} isPlaying - 再生中かどうか
 * @property {string|null} currentSongId - 現在の曲ID
 * @property {string|null} audioUrl - オーディオURL
 * @property {boolean} isEnded - 再生終了したかどうか
 * @property {function} initializeAudio - オーディオの初期化関数
 * @property {function} play - 再生関数
 * @property {function} pause - 一時停止関数
 * @property {function} seek - シーク関数
 * @property {function} cleanup - クリーンアップ関数
 * @property {function} setIsPlaying - 再生状態設定関数
 * @property {function} setIsEnded - 終了状態設定関数
 */
const useAudioWaveStore = create<AudioWaveState>((set, get) => ({
  audioContext: null,
  analyser: null,
  audioElement: null,
  source: null,
  currentTime: 0,
  duration: 0,
  isPlaying: false,
  currentSongId: null,
  audioUrl: null,
  isEnded: false,

  /**
   * オーディオを初期化する関数
   * 新しいオーディオURLと曲IDを設定し、AudioContextとAnalyserを作成します
   *
   * @param audioUrl - 再生するオーディオファイルのURL
   * @param songId - 曲の一意識別子
   */
  initializeAudio: async (audioUrl: string, songId: string) => {
    const state = get();

    // 既存のオーディオがある場合はクリーンアップする
    if (state.audioElement) {
      state.cleanup();
    }

    // 新しいAudioContextを作成
    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;

    // オーディオ要素を作成して設定
    const audioElement = new Audio(audioUrl);
    audioElement.crossOrigin = "anonymous";
    audioElement.volume = 0.1;

    // オーディオノードを接続
    const source = audioContext.createMediaElementSource(audioElement);
    source.connect(analyser);
    analyser.connect(audioContext.destination);

    // イベントリスナーを設定
    // 再生時間が更新されたときのイベントリスナー
    audioElement.addEventListener("timeupdate", () => {
      set({ currentTime: audioElement.currentTime });
    });

    // メタデータが読み込まれたときのイベントリスナー
    audioElement.addEventListener("loadedmetadata", () => {
      set({ duration: audioElement.duration });
    });

    // 再生が終了したときのイベントリスナー
    audioElement.addEventListener("ended", () => {
      set({ isPlaying: false, isEnded: true });
    });

    // 状態を更新
    set({
      audioContext,
      analyser,
      audioElement,
      source,
      currentSongId: songId,
      audioUrl,
      isEnded: false,
    });
  },

  /**
   * オーディオを再生する関数
   * 一時停止されていた場合はコンテキストを再開し、再生を開始します
   */
  play: async () => {
    const { audioElement, audioContext } = get();

    if (audioElement && audioContext) {
      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      await audioElement.play();
      set({ isPlaying: true, isEnded: false });
    }
  },

  /**
   * オーディオを一時停止する関数
   * 再生中のオーディオを停止し、再生状態を更新します
   */
  pause: () => {
    const { audioElement } = get();

    if (audioElement) {
      audioElement.pause();
      set({ isPlaying: false });
    }
  },

  /**
   * 特定の時間位置にシークする関数
   *
   * @param time - シーク先の時間（秒）
   */
  seek: (time: number) => {
    const { audioElement } = get();

    if (audioElement) {
      audioElement.currentTime = time;
      set({ currentTime: time });
    }
  },

  /**
   * オーディオリソースをクリーンアップする関数
   * オーディオ要素を停止し、AudioContextを閉じ、すべての状態をリセットします
   */
  cleanup: () => {
    const state = get();

    if (state.audioElement) {
      state.audioElement.pause();
      state.audioElement.src = "";
      state.audioElement.load();
    }

    if (state.audioContext) {
      state.audioContext.close();
    }
    // すべての状態をリセット
    set({
      audioContext: null,
      analyser: null,
      audioElement: null,
      source: null,
      currentTime: 0,
      duration: 0,
      isPlaying: false,
      currentSongId: null,
      audioUrl: null,
      isEnded: false,
    });
  },

  /**
   * 再生状態を設定する関数
   *
   * @param isPlaying - 再生中かどうかのフラグ
   */
  setIsPlaying: (isPlaying) => set({ isPlaying }),

  /**
   * 終了状態を設定する関数
   *
   * @param isEnded - 再生が終了したかどうかのフラグ
   */
  setIsEnded: (isEnded) => set({ isEnded }),
}));

export default useAudioWaveStore;
