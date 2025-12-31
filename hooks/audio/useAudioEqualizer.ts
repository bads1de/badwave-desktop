import { useEffect } from "react";
import useEqualizerStore from "@/hooks/stores/useEqualizerStore";
import usePlaybackRateStore from "@/hooks/stores/usePlaybackRateStore";
import { AudioEngine } from "@/libs/audio/AudioEngine";

/**
 * AudioEngineのイコライザーノードを制御するフック
 * ストアの状態変更をエンジンに反映する
 */
const useAudioEqualizer = () => {
  const isEnabled = useEqualizerStore((state) => state.isEnabled);
  const bands = useEqualizerStore((state) => state.bands);
  const isSlowedReverb = usePlaybackRateStore((state) => state.isSlowedReverb);

  const engine = AudioEngine.getInstance();

  // ストアのゲイン変更を反映
  useEffect(() => {
    if (!engine.isInitialized || !engine.filters) return;

    engine.filters.forEach((filter, index) => {
      const band = bands[index];
      if (band) {
        filter.gain.value = isEnabled ? band.gain : 0;
      }
    });
  }, [bands, isEnabled, engine.isInitialized, engine.filters]);

  // Slowed + Reverbの状態変更を反映
  useEffect(() => {
    if (!engine.isInitialized || !engine.reverbGainNode || !engine.context)
      return;

    const targetGain = isSlowedReverb ? 0.4 : 0;
    engine.reverbGainNode.gain.setTargetAtTime(
      targetGain,
      engine.context.currentTime,
      0.1
    );
  }, [
    isSlowedReverb,
    engine.isInitialized,
    engine.reverbGainNode,
    engine.context,
  ]);

  return {
    isInitialized: engine.isInitialized,
  };
};

export default useAudioEqualizer;
