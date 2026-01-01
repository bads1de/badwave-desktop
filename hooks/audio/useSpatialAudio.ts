import { useEffect } from "react";
import useSpatialStore from "@/hooks/stores/useSpatialStore";
import usePlaybackRateStore from "@/hooks/stores/usePlaybackRateStore";
import { AudioEngine } from "@/libs/audio/AudioEngine";

/**
 * 空間オーディオとリバーブ設定を適用するフック
 * AudioEngine の Spatial Mode と Reverb Gain を制御する
 */
const useSpatialAudio = () => {
  const isSpatialEnabled = useSpatialStore((state) => state.isSpatialEnabled);
  const isSlowedReverb = usePlaybackRateStore((state) => state.isSlowedReverb);

  useEffect(() => {
    const engine = AudioEngine.getInstance();

    // 初期化されていない場合は何もしない
    // (AudioEngine.initialize() は PlayerContent などで呼ばれる想定だが、
    //  タイミングによってはまだの場合があるのでチェック)

    // Spatial Mode の適用
    // 優先度高: Spatial Mode がONなら、Slowed+Reverbのリバーブ設定よりも優先
    if (isSpatialEnabled) {
      engine.setSpatialMode(true);
    } else {
      // Spatial Mode が OFF の場合、Slowed+Reverb の状態を確認
      engine.setSpatialMode(false);

      if (isSlowedReverb) {
        engine.setSlowedReverbMode(true);
      } else {
        engine.setSlowedReverbMode(false);
      }
    }
  }, [isSpatialEnabled, isSlowedReverb]);

  return { isSpatialEnabled };
};

export default useSpatialAudio;
