import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { BsPauseFill, BsPlayFill } from "react-icons/bs";
import { HiSpeakerWave, HiSpeakerXMark } from "react-icons/hi2";
import useVolumeStore from "./useVolumeStore"; // 既存の音量ストアを再利用
import {
  AudioPlayerHookProps,
  AudioPlayerInterface,
} from "./useAudioPlayerInterface";

/**
 * ローカルファイル用のオーディオプレイヤーフック
 *
 * @param {AudioPlayerHookProps} props - フックのプロパティ
 * @returns {AudioPlayerInterface} オーディオプレイヤーインターフェース
 */
const useLocalAudioPlayer = (
  props?: AudioPlayerHookProps
): AudioPlayerInterface => {
  const { onEnded } = props || {};
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSongPath, setCurrentSongPath] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const { volume, setVolume } = useVolumeStore();

  // UI表示用アイコン
  const Icon = isPlaying ? BsPauseFill : BsPlayFill;
  const VolumeIcon =
    volume === null
      ? HiSpeakerWave
      : volume === 0
      ? HiSpeakerXMark
      : HiSpeakerWave;

  /**
   * 指定されたパスの音声を再生する
   * @param {string} path - 再生する音声ファイルのパス
   */
  const play = useCallback(
    (path: string) => {
      const audio = audioRef.current;
      if (audio) {
        const playAudio = () => {
          audio
            .play()
            .then(() => {
              setIsPlaying(true);
            })
            .catch((error) => {
              console.error("Error playing audio:", error);
              setIsPlaying(false); // エラー時は再生状態をfalseに
            });
        };

        if (currentSongPath !== path || audio.src !== path) {
          console.log("[useLocalAudioPlayer] Setting audio source:", path);
          audio.src = path;
          setCurrentSongPath(path);
          audio.currentTime = 0; // 新しい曲の場合は最初から
          audio.load(); // 明示的にロードを呼び出す

          const onCanPlayThrough = () => {
            playAudio();
            audio.removeEventListener("canplaythrough", onCanPlayThrough);
            audio.removeEventListener("error", onError); // エラーリスナーも削除
          };

          const onError = (e: Event) => {
            console.error("Error loading audio:", e);
            setIsPlaying(false);
            audio.removeEventListener("canplaythrough", onCanPlayThrough);
            audio.removeEventListener("error", onError);
          };

          audio.addEventListener("canplaythrough", onCanPlayThrough);
          audio.addEventListener("error", onError); // エラーイベントのリスナーを追加
        } else {
          // 同じ曲で、既に読み込み済みの場合 (srcが同じ)
          playAudio();
        }
      }
    },
    [currentSongPath]
  );

  /**
   * 現在再生中の音声を一時停止する
   */
  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  /**
   * 再生/一時停止を切り替える
   * @param {string} path - 再生する音声ファイルのパス（オプション）
   */
  const togglePlayPause = useCallback(
    (path?: string) => {
      if (isPlaying) {
        pause();
      } else {
        if (path) {
          play(path);
        } else if (currentSongPath && audioRef.current?.src) {
          // pathが指定されず、既に曲が読み込まれていれば再生
          audioRef.current
            .play()
            .catch((error) => console.error("Error playing audio:", error));
          setIsPlaying(true);
        }
      }
    },
    [isPlaying, pause, play, currentSongPath]
  );

  /**
   * 再生位置を指定した時間に設定する
   * @param {number} time - 設定する再生時間（秒）
   */
  const handleSeek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  // オーディオイベントリスナーの設定
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleAudioEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0); // 再生時間をリセット
      if (onEnded) {
        onEnded();
      }
    };
    const handleCanPlayThrough = () => {
      // 自動再生はplay関数で行うため、ここでは何もしない
    };
    const handlePlayEvent = () => setIsPlaying(true);
    const handlePauseEvent = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleAudioEnded);
    audio.addEventListener("canplaythrough", handleCanPlayThrough);
    audio.addEventListener("play", handlePlayEvent);
    audio.addEventListener("pause", handlePauseEvent);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleAudioEnded);
      audio.removeEventListener("canplaythrough", handleCanPlayThrough);
      audio.removeEventListener("play", handlePlayEvent);
      audio.removeEventListener("pause", handlePauseEvent);
    };
  }, [onEnded]);

  // 音量変更時の処理
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || volume === null) return;
    audio.volume = volume;
  }, [volume]);

  /**
   * 時間を「分:秒」形式にフォーマットする関数
   */
  const formatTime = useMemo(() => {
    return (time: number) => {
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60);
      return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    };
  }, []);

  // フォーマット済みの時間表示
  const formattedCurrentTime = useMemo(
    () => formatTime(currentTime),
    [currentTime, formatTime]
  );

  const formattedDuration = useMemo(
    () => formatTime(duration),
    [duration, formatTime]
  );

  // HTMLAudioElementを生成してrefに設定
  useEffect(() => {
    if (!audioRef.current) {
      (audioRef as React.MutableRefObject<HTMLAudioElement | null>).current =
        new Audio();
    }
  }, []);

  return {
    Icon,
    VolumeIcon,
    formattedCurrentTime,
    formattedDuration,
    volume,
    setVolume,
    audioRef,
    currentTime,
    duration,
    isPlaying,
    currentSongPath,
    play,
    pause,
    togglePlayPause,
    handleSeek,
    setCurrentSongPath, // 外部から曲のパスを設定できるように
  };
};

export default useLocalAudioPlayer;
