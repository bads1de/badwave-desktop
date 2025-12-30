import { useEffect, useRef } from "react";
import usePlaybackRateStore from "@/hooks/stores/usePlaybackRateStore";

/**
 * ストアから取得した再生速度をオーディオ要素に適用します。
 * @param audioRef オーディオ要素への参照
 */
const usePlaybackRate = (
  audioRef: React.RefObject<HTMLAudioElement | null>
) => {
  const rate = usePlaybackRateStore((state) => state.rate);
  const audio = audioRef.current;

  // 再生速度が変更された、またはオーディオ要素が利用可能になったときに適用します
  useEffect(() => {
    if (audio) {
      audio.playbackRate = rate;
    }
  }, [audio, rate]);

  // ソースが変更された場合に再生速度が再適用されるようにします（一部のブラウザではリセットされるため）
  useEffect(() => {
    const handleDurationChange = () => {
      if (audio) {
        audio.playbackRate = rate;
      }
    };

    if (audio) {
      audio.addEventListener("durationchange", handleDurationChange);
      return () => {
        audio.removeEventListener("durationchange", handleDurationChange);
      };
    }
  }, [audio, rate]);

  return { rate };
};

export default usePlaybackRate;
