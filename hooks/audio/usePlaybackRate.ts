import { useEffect } from "react";
import usePlaybackRateStore from "@/hooks/stores/usePlaybackRateStore";
import { AudioEngine } from "@/libs/audio/AudioEngine";

/**
 * AudioEngineのaudio要素に再生速度を適用するフック
 */
const usePlaybackRate = () => {
  const rate = usePlaybackRateStore((state) => state.rate);
  const isSlowedReverb = usePlaybackRateStore((state) => state.isSlowedReverb);

  const engine = AudioEngine.getInstance();
  const audio = engine.audio;

  // 再生速度を適用
  useEffect(() => {
    if (!audio) return;

    const targetRate = isSlowedReverb ? 0.85 : rate;
    audio.playbackRate = targetRate;

    // preservesPitch プロパティの設定
    // @ts-ignore
    audio.preservesPitch = !isSlowedReverb;
    // @ts-ignore
    audio.mozPreservesPitch = !isSlowedReverb;
    // @ts-ignore
    audio.webkitPreservesPitch = !isSlowedReverb;
  }, [audio, rate, isSlowedReverb]);

  // ソース変更時に再生速度を再適用
  useEffect(() => {
    if (!audio) return;

    const handleDurationChange = () => {
      const targetRate = isSlowedReverb ? 0.85 : rate;
      audio.playbackRate = targetRate;

      // @ts-ignore
      audio.preservesPitch = !isSlowedReverb;
      // @ts-ignore
      audio.mozPreservesPitch = !isSlowedReverb;
      // @ts-ignore
      audio.webkitPreservesPitch = !isSlowedReverb;
    };

    audio.addEventListener("durationchange", handleDurationChange);
    return () => {
      audio.removeEventListener("durationchange", handleDurationChange);
    };
  }, [audio, rate, isSlowedReverb]);

  return { rate };
};

export default usePlaybackRate;
