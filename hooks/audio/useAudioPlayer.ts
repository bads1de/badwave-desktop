import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import usePlayer from "@/hooks/player/usePlayer";
import useVolumeStore from "@/hooks/stores/useVolumeStore";
import usePlaybackStateStore, {
  POSITION_SAVE_INTERVAL_MS,
} from "@/hooks/stores/usePlaybackStateStore";
import { isLocalFilePath, toFileUrl } from "@/libs/songUtils";
import { Song } from "@/types";

/**
 * オーディオプレイヤーの状態と操作を管理するカスタムフック
 * ストリーミング曲とローカルファイルの両方に対応
 *
 * @param {string} songUrl - 再生する曲のURL（ストリーミングまたはローカルファイルパス）
 * @param {Song} song - 曲オブジェクト（ローカル曲判定用）
 * @returns {Object} プレイヤーの状態と操作関数を含むオブジェクト
 * @property {React.ComponentType} Icon - 再生/一時停止アイコン
 * @property {React.ComponentType} VolumeIcon - 音量アイコン
 * @property {string} formattedCurrentTime - フォーマットされた現在の再生時間
 * @property {string} formattedDuration - フォーマットされた曲の長さ
 * @property {function} toggleMute - ミュート切り替え関数
 * @property {number} volume - 現在の音量
 * @property {function} setVolume - 音量設定関数
 * @property {React.RefObject} audioRef - オーディオ要素への参照
 * @property {number} currentTime - 現在の再生時間（秒）
 * @property {number} duration - 曲の長さ（秒）
 * @property {boolean} isPlaying - 再生中かどうか
 * @property {boolean} isRepeating - リピート再生中かどうか
 * @property {boolean} isShuffling - シャッフル再生中かどうか
 * @property {function} handlePlay - 再生/一時停止切り替え関数
 * @property {function} handleSeek - シーク操作関数
 * @property {function} onPlayNext - 次の曲を再生する関数
 * @property {function} onPlayPrevious - 前の曲を再生する関数
 * @property {function} toggleRepeat - リピート切り替え関数
 * @property {function} toggleShuffle - シャッフル切り替え関数
 * @property {boolean} isLocalFile - ローカルファイルかどうか
 */
const useAudioPlayer = (songUrl: string, song?: Song) => {
  const player = usePlayer();
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const isRepeating = usePlayer((state) => state.isRepeating);
  const isShuffling = usePlayer((state) => state.isShuffling);

  // song_pathがローカルファイルパスかどうかを判定（オーディオ再生時のURL変換に使用）
  const isLocalFile = useMemo(() => isLocalFilePath(songUrl), [songUrl]);

  // ボリューム管理のカスタムフックを使用
  const { volume, setVolume } = useVolumeStore();

  // 再生状態の保存用
  const {
    savePlaybackState,
    updatePosition,
    songId: savedSongId,
    position: savedPosition,
    hasHydrated: playbackStateHydrated,
    isRestoring,
    setIsRestoring,
  } = usePlaybackStateStore();
  const lastSaveTimeRef = useRef<number>(0);
  const hasRestoredRef = useRef<boolean>(false);

  // --- Refパターン: イベントリスナー内から最新の状態を参照するため ---
  const isPlayingRef = useRef(isPlaying);
  const isRestoringRef = useRef(isRestoring);
  const isRepeatingRef = useRef(isRepeating);

  const handlePlay = useCallback(() => {
    // 復元中フラグをクリア（以降は通常の自動再生を許可）
    if (isRestoring) {
      setIsRestoring(false);
    }
    setIsPlaying((prev) => !prev);
  }, [isRestoring, setIsRestoring]);

  const handleSeek = useCallback(
    (time: number) => {
      if (audioRef.current) {
        audioRef.current.currentTime = time;
        setCurrentTime(time);
        // シーク時に再生位置を保存
        const activeId = player.activeId;
        if (activeId) {
          savePlaybackState(activeId, time, player.ids);
        }
      }
    },
    [player.activeId, player.ids, savePlaybackState]
  );

  // 次の曲を再生する関数
  const onPlayNext = useCallback(() => {
    if (isRepeating) {
      player.toggleRepeat();
    }
    const nextSongId = player.getNextSongId();
    if (nextSongId) {
      player.setId(nextSongId);
    }
  }, [isRepeating, player]);

  // onPlayNextをRef経由で参照（イベントリスナー内から最新のコールバックを呼ぶため）
  const onPlayNextRef = useRef(onPlayNext);

  // 前の曲を再生する関数
  const onPlayPrevious = useCallback(() => {
    if (isRepeating) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
      }
    } else {
      const prevSongId = player.getPreviousSongId();
      if (prevSongId) {
        player.setId(prevSongId);
      }
    }
  }, [isRepeating, player]);

  // リピート切り替え関数
  const toggleRepeat = useCallback(() => {
    player.toggleRepeat();
  }, [player]);

  // シャッフル切り替え関数
  const toggleShuffle = useCallback(() => {
    player.toggleShuffle();
  }, [player]);

  // --- Refの同期: 状態が変わるたびにRefを更新 ---
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    isRestoringRef.current = isRestoring;
  }, [isRestoring]);

  useEffect(() => {
    isRepeatingRef.current = isRepeating;
  }, [isRepeating]);

  useEffect(() => {
    onPlayNextRef.current = onPlayNext;
  }, [onPlayNext]);

  // オーディオ要素のイベントリスナーを設定
  // 注意: Refパターンを使用して、songUrl/isLocalFile変更時のみリスナーを再登録
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);

    const handleEnded = () => {
      // Ref経由で最新の状態を参照
      if (isRepeatingRef.current) {
        audio.currentTime = 0;
        audio.play();
      } else {
        onPlayNextRef.current();
      }
    };

    // ローカルファイルの場合は自動再生を制御
    const handleCanPlayThrough = () => {
      // 復元中は自動再生しない（ユーザーが手動で再生ボタンを押すまで待つ）
      if (isRestoringRef.current) {
        return;
      }

      if (isLocalFile) {
        // ローカルファイルの場合は明示的に再生状態をチェック
        if (isPlayingRef.current) {
          audio.play().catch((error) => {
            console.error("Error playing local audio:", error);
            setIsPlaying(false);
          });
        }
      } else {
        // ストリーミングの場合は従来通り
        audio.play();
      }
    };

    const handlePlay = () => setIsPlaying(true);

    const handlePause = () => {
      setIsPlaying(false);
      // 一時停止時に再生位置を保存
      // 注意: player.activeId, player.ids, savePlaybackState はクロージャで
      // キャプチャされるが、曲変更時にはuseEffectが再実行されるため問題なし
      const activeId = player.activeId;
      if (activeId) {
        savePlaybackState(activeId, audio.currentTime, player.ids);
      }
    };

    // ローカルファイルの場合のエラーハンドリング
    const handleError = (e: Event) => {
      console.error("Audio error:", e);
      setIsPlaying(false);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("canplaythrough", handleCanPlayThrough);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("canplaythrough", handleCanPlayThrough);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("error", handleError);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [songUrl, isLocalFile]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play();
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !songUrl) return;

    audio.currentTime = 0;

    // ローカルファイルの場合はfile://スキーマを付与
    if (isLocalFile) {
      audio.src = toFileUrl(songUrl);
      console.log("[useAudioPlayer] Setting local file source:", audio.src);
    } else {
      audio.src = songUrl;
    }
  }, [songUrl, isLocalFile]);

  // 定期的な再生位置の保存（5秒ごと、デバウンス）
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      const audio = audioRef.current;
      const activeId = player.activeId;
      if (audio && activeId) {
        const now = Date.now();
        if (now - lastSaveTimeRef.current >= POSITION_SAVE_INTERVAL_MS) {
          updatePosition(audio.currentTime);
          lastSaveTimeRef.current = now;
        }
      }
    }, POSITION_SAVE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isPlaying, player.activeId, updatePosition]);

  // ページ離脱時に再生位置を保存
  useEffect(() => {
    const handleBeforeUnload = () => {
      const audio = audioRef.current;
      const activeId = player.activeId;
      if (audio && activeId) {
        savePlaybackState(activeId, audio.currentTime, player.ids);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [player.activeId, player.ids, savePlaybackState]);

  // 保存された再生位置から復元
  useEffect(() => {
    const audio = audioRef.current;
    if (
      !audio ||
      !playbackStateHydrated ||
      hasRestoredRef.current ||
      !savedSongId ||
      !player.activeId
    ) {
      return;
    }

    // 保存された曲と現在の曲が一致する場合のみ復元
    if (savedSongId === player.activeId && savedPosition > 0) {
      const handleCanPlay = () => {
        if (!hasRestoredRef.current && savedPosition > 0) {
          audio.currentTime = savedPosition;
          hasRestoredRef.current = true;
        }
      };

      audio.addEventListener("canplay", handleCanPlay, { once: true });
      return () => audio.removeEventListener("canplay", handleCanPlay);
    }
  }, [playbackStateHydrated, savedSongId, savedPosition, player.activeId]);

  const formatTime = useMemo(() => {
    return (time: number) => {
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60);
      return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    };
  }, []);

  const formattedCurrentTime = useMemo(
    () => formatTime(currentTime),
    [currentTime, formatTime]
  );

  const formattedDuration = useMemo(
    () => formatTime(duration),
    [duration, formatTime]
  );

  return {
    formattedCurrentTime,
    formattedDuration,
    audioRef,
    currentTime,
    duration,
    isPlaying,
    isRepeating,
    isShuffling,
    handlePlay,
    handleSeek,
    onPlayNext,
    onPlayPrevious,
    toggleRepeat,
    toggleShuffle,
    isLocalFile,
  };
};

export default useAudioPlayer;
