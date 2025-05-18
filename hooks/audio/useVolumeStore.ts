import { useState, useEffect, useRef } from "react";
import { isMobile } from "react-device-detect";
import { store } from "@/libs/electron-utils";
import { ELECTRON_STORE_KEYS } from "@/constants";

/**
 * ボリューム設定を管理するカスタムフック
 *
 * Electronのストアを使用してボリューム設定を永続化し、
 * アプリ再起動時にも前回の設定を維持します。
 *
 * @returns {Object} ボリューム関連の状態と操作関数
 * @property {number|null} volume - 現在のボリューム値（0〜1）
 * @property {function} setVolume - ボリュームを設定する関数
 * @property {boolean} isLoaded - ボリューム設定が読み込まれたかどうか
 */
const useVolumeStore = () => {
  // 初期値を設定せず、ローディング状態を追加
  const [volume, setVolume] = useState<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  // 前回のボリューム値を保持するRef
  const prevVolumeRef = useRef<number | null>(null);

  // 起動時にストアからボリューム設定を読み込む
  useEffect(() => {
    // すでにボリュームが読み込まれている場合は何もしない
    if (isLoaded) return;

    const loadVolume = async () => {
      try {
        const savedVolume = await store.get<number>(ELECTRON_STORE_KEYS.VOLUME);

        if (savedVolume !== undefined && savedVolume !== null) {
          setVolume(savedVolume);
          prevVolumeRef.current = savedVolume;
        } else {
          const defaultVolume = isMobile ? 1 : 0.1;

          setVolume(defaultVolume);
          prevVolumeRef.current = defaultVolume;
        }
        setIsLoaded(true);
      } catch (error) {
        const defaultVolume = isMobile ? 1 : 0.1;

        setVolume(defaultVolume);
        prevVolumeRef.current = defaultVolume;
        setIsLoaded(true);
      }
    };

    loadVolume();
  }, [isLoaded]);

  // ボリュームが変更されたときにストアに保存
  useEffect(() => {
    if (volume === null) return;

    // ボリューム設定をストアに保存
    const saveVolume = async () => {
      try {
        await store.set(ELECTRON_STORE_KEYS.VOLUME, volume);

        prevVolumeRef.current = volume;
      } catch (error) {}
    };

    // 前回保存した値と異なる場合のみ保存処理を実行
    if (prevVolumeRef.current !== volume) {
      saveVolume();
    }
  }, [volume]);

  return {
    volume,
    setVolume,
    isLoaded,
  };
};

export default useVolumeStore;
