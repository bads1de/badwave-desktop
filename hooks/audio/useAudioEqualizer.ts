import { useEffect, useRef, useCallback } from "react";
import useEqualizerStore, { EQ_BANDS } from "@/hooks/stores/useEqualizerStore";
import usePlaybackRateStore from "@/hooks/stores/usePlaybackRateStore";

interface EqualizerNodes {
  context: AudioContext;
  sourceNode: MediaElementAudioSourceNode;
  filters: BiquadFilterNode[];
  gainNode: GainNode;
  reverbGainNode: GainNode;
  convolver: ConvolverNode;
}

/**
 * オーディオ要素にイコライザーを適用するカスタムフック
 * Web Audio API を使用して 6 バンドのイコライザーを実現
 *
 * @param audioRef - オーディオ要素への参照
 */
const useAudioEqualizer = (
  audioRef: React.RefObject<HTMLAudioElement | null>
) => {
  const nodesRef = useRef<EqualizerNodes | null>(null);
  const isInitializedRef = useRef<boolean>(false);

  // ストアから状態を取得
  const isEnabled = useEqualizerStore((state) => state.isEnabled);
  const bands = useEqualizerStore((state) => state.bands);

  const isSlowedReverb = usePlaybackRateStore((state) => state.isSlowedReverb);

  // イコライザーノードの初期化
  const initializeEqualizer = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || isInitializedRef.current) return;

    try {
      const context = new AudioContext();
      const sourceNode = context.createMediaElementSource(audio);

      // 6バンド分のBiquadFilterを作成
      const filters: BiquadFilterNode[] = EQ_BANDS.map((band, index) => {
        const filter = context.createBiquadFilter();
        // 最初と最後はシェルビングフィルター、それ以外はピーキングフィルター
        if (index === 0) {
          filter.type = "lowshelf";
        } else if (index === EQ_BANDS.length - 1) {
          filter.type = "highshelf";
        } else {
          filter.type = "peaking";
          filter.Q.value = 1.4; // Q値 (帯域幅)
        }
        filter.frequency.value = band.freq;
        filter.gain.value = 0; // 初期値は0dB
        return filter;
      });

      // ゲインノード（マスター音量調整用、将来の拡張性のため）
      const gainNode = context.createGain();
      gainNode.gain.value = 1;

      // ノードを直列に接続: source -> filter1 -> filter2 -> ... -> gain -> destination
      let currentNode: AudioNode = sourceNode;
      filters.forEach((filter) => {
        currentNode.connect(filter);
        currentNode = filter;
      });
      currentNode.connect(gainNode);
      gainNode.connect(context.destination);

      // リバーブ用ノードの作成と接続
      const convolver = context.createConvolver();
      const reverbGainNode = context.createGain();

      // シンプルなインパルス応答を生成 (3秒間、減衰あり)
      const sampleRate = context.sampleRate;
      const length = sampleRate * 3;
      const impulse = context.createBuffer(2, length, sampleRate);
      const left = impulse.getChannelData(0);
      const right = impulse.getChannelData(1);

      for (let i = 0; i < length; i++) {
        const reverseIndex = length - i;
        // 指数関数的減衰 + ランダムノイズ
        const decay = Math.pow(reverseIndex / length, 2);
        left[i] = (Math.random() * 2 - 1) * decay;
        right[i] = (Math.random() * 2 - 1) * decay;
      }
      convolver.buffer = impulse;

      // Filterの出力から分岐してリバーブへ
      // 構成: LastFilter -> GainNode (Dry) -> Destination
      //          |
      //           -> ReverbGain (Wet) -> Convolver -> Destination

      // 注: currentNodeは最後のフィルター
      currentNode.connect(reverbGainNode);
      reverbGainNode.connect(convolver);
      convolver.connect(context.destination);

      nodesRef.current = {
        context,
        sourceNode,
        filters,
        gainNode,
        reverbGainNode,
        convolver,
      };
      isInitializedRef.current = true;

      console.log(
        "[useAudioEqualizer] Equalizer & Reverb initialized successfully"
      );
    } catch (error) {
      console.error(
        "[useAudioEqualizer] Failed to initialize equalizer:",
        error
      );
    }
  }, [audioRef]);

  // オーディオ要素の canplaythrough イベントで初期化
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleCanPlay = () => {
      if (!isInitializedRef.current) {
        initializeEqualizer();
      }
    };

    // 既に再生可能な状態なら即初期化
    if (audio.readyState >= 3) {
      initializeEqualizer();
    }

    audio.addEventListener("canplaythrough", handleCanPlay);

    return () => {
      audio.removeEventListener("canplaythrough", handleCanPlay);
    };
  }, [audioRef, initializeEqualizer]);

  // ストアのゲイン変更を反映
  useEffect(() => {
    const nodes = nodesRef.current;
    if (!nodes) return;

    nodes.filters.forEach((filter, index) => {
      const band = bands[index];
      if (band) {
        // イコライザーが有効な場合のみゲインを適用
        filter.gain.value = isEnabled ? band.gain : 0;
      }
    });
  }, [bands, isEnabled]);

  // Slowed + Reverbの状態変更を反映
  useEffect(() => {
    const nodes = nodesRef.current;
    if (!nodes) return;

    if (nodes.reverbGainNode) {
      // リバーブのウェット成分 (isSlowedReverbが有効な場合のみ)
      // 0.4くらいがちょうどいいアンビエンス感
      const targetGain = isSlowedReverb ? 0.4 : 0;
      nodes.reverbGainNode.gain.setTargetAtTime(
        targetGain,
        nodes.context.currentTime,
        0.1
      );
    }
  }, [isSlowedReverb]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      const nodes = nodesRef.current;
      if (nodes) {
        try {
          nodes.sourceNode.disconnect();
          nodes.filters.forEach((filter) => filter.disconnect());
          nodes.gainNode.disconnect();
          // リバーブ系ノードの切断
          nodes.reverbGainNode.disconnect();
          nodes.convolver.disconnect();

          nodes.context.close();
        } catch (error) {
          console.error("[useAudioEqualizer] Cleanup error:", error);
        }
        nodesRef.current = null;
        isInitializedRef.current = false;
      }
    };
  }, []);

  return {
    isInitialized: isInitializedRef.current,
  };
};

export default useAudioEqualizer;
