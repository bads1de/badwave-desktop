import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import usePlayer from "@/hooks/player/usePlayer";
import useVolumeStore from "@/hooks/stores/useVolumeStore";
import usePlaybackStateStore, {
  POSITION_SAVE_INTERVAL_MS,
} from "@/hooks/stores/usePlaybackStateStore";
import { isLocalFilePath, toFileUrl } from "@/libs/songUtils";
import { Song } from "@/types";
import { AudioEngine } from "@/libs/audio/AudioEngine";

/**
 * AudioEngineシングルトンを使用するオーディオプレイヤーフック
 * ページ遷移でもaudio要素が消えないため、再生が継続される
 */
const useAudioPlayer = (songUrl: string, song?: Song) => {
  const player = usePlayer();
  const engine = AudioEngine.getInstance();

  // クライアントサイドで初期化（サーバーサイドでは実行されない）
  if (!engine.isInitialized) {
    engine.initialize();
  }

  const audio = engine.audio;

  // マウント時にエンジンの状態を引き継ぐ（リマウント対策の核心）
  const [isPlaying, setIsPlaying] = useState(() =>
    audio ? !audio.paused : false
  );
  const [currentTime, setCurrentTime] = useState(() =>
    audio ? audio.currentTime : 0
  );
  const [duration, setDuration] = useState(() =>
    audio ? audio.duration || 0 : 0
  );

  const isRepeating = usePlayer((state) => state.isRepeating);
  const isShuffling = usePlayer((state) => state.isShuffling);
  const isLocalFile = useMemo(() => isLocalFilePath(songUrl), [songUrl]);

  const { volume } = useVolumeStore();
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
  const isPlayingRef = useRef(isPlaying);
  const isRestoringRef = useRef(isRestoring);
  const isRepeatingRef = useRef(isRepeating);

  // Ref同期
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    isRestoringRef.current = isRestoring;
  }, [isRestoring]);

  useEffect(() => {
    isRepeatingRef.current = isRepeating;
  }, [isRepeating]);

  const handlePlay = useCallback(() => {
    if (isRestoring) {
      setIsRestoring(false);
    }
    setIsPlaying((prev) => !prev);
  }, [isRestoring, setIsRestoring]);

  const handleSeek = useCallback(
    (time: number) => {
      if (audio) {
        audio.currentTime = time;
        setCurrentTime(time);
        const activeId = player.activeId;
        if (activeId) {
          savePlaybackState(activeId, time, player.ids);
        }
      }
    },
    [audio, player.activeId, player.ids, savePlaybackState]
  );

  const onPlayNext = useCallback(() => {
    if (isRepeating) {
      player.toggleRepeat();
    }
    const nextSongId = player.getNextSongId();
    if (nextSongId) {
      player.setId(nextSongId);
    }
  }, [isRepeating, player]);

  const onPlayNextRef = useRef(onPlayNext);
  useEffect(() => {
    onPlayNextRef.current = onPlayNext;
  }, [onPlayNext]);

  const onPlayPrevious = useCallback(() => {
    if (isRepeating && audio) {
      audio.currentTime = 0;
    } else {
      const prevSongId = player.getPreviousSongId();
      if (prevSongId) {
        player.setId(prevSongId);
      }
    }
  }, [isRepeating, audio, player]);

  const toggleRepeat = useCallback(() => {
    player.toggleRepeat();
  }, [player]);

  const toggleShuffle = useCallback(() => {
    player.toggleShuffle();
  }, [player]);

  // 再生/停止の同期
  useEffect(() => {
    if (!audio) return;

    // AudioContextをresumeする
    if (isPlaying && engine.context?.state === "suspended") {
      engine.resumeContext();
    }

    if (isPlaying && audio.paused) {
      audio.play().catch(() => {});
    } else if (!isPlaying && !audio.paused) {
      audio.pause();
    }
  }, [isPlaying, audio, engine]);

  // イベントリスナー
  useEffect(() => {
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => {
      if (isRepeatingRef.current) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else {
        onPlayNextRef.current();
      }
    };
    const handleCanPlayThrough = () => {
      if (isRestoringRef.current) return;
      if (isPlayingRef.current && audio.paused) {
        audio.play().catch(() => {});
      }
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => {
      setIsPlaying(false);
      const activeId = player.activeId;
      if (activeId) {
        savePlaybackState(activeId, audio.currentTime, player.ids);
      }
    };
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
  }, [audio, player.activeId, player.ids, savePlaybackState]);

  // ボリューム適用
  useEffect(() => {
    if (audio) {
      audio.volume = volume;
    }
  }, [volume, audio]);

  // 曲のロード（リマウント対策: 同一曲ならスキップ）
  useEffect(() => {
    if (!audio || !songUrl || !song?.id) return;

    const newSongId = String(song.id);

    // 同一曲なら再設定をスキップ
    if (engine.currentSongId === newSongId && audio.src !== "") {
      return;
    }

    engine.currentSongId = newSongId;
    audio.currentTime = 0;

    if (isLocalFile) {
      audio.src = toFileUrl(songUrl);
    } else {
      audio.src = songUrl;
    }
  }, [songUrl, isLocalFile, song?.id, audio, engine]);

  // 再生位置の自動保存
  useEffect(() => {
    if (!isPlaying || !audio) return;

    const interval = setInterval(() => {
      const activeId = player.activeId;
      if (activeId) {
        const now = Date.now();
        if (now - lastSaveTimeRef.current >= POSITION_SAVE_INTERVAL_MS) {
          updatePosition(audio.currentTime);
          lastSaveTimeRef.current = now;
        }
      }
    }, POSITION_SAVE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isPlaying, player.activeId, updatePosition, audio]);

  // ページ離脱時に再生位置を保存
  useEffect(() => {
    const handleBeforeUnload = () => {
      const activeId = player.activeId;
      if (audio && activeId) {
        savePlaybackState(activeId, audio.currentTime, player.ids);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [audio, player.activeId, player.ids, savePlaybackState]);

  // 保存された再生位置から復元
  useEffect(() => {
    if (
      !audio ||
      !playbackStateHydrated ||
      hasRestoredRef.current ||
      !savedSongId ||
      !player.activeId
    ) {
      return;
    }

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
  }, [
    audio,
    playbackStateHydrated,
    savedSongId,
    savedPosition,
    player.activeId,
  ]);

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
