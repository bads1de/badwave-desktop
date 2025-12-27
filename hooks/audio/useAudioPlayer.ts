import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import usePlayer from "@/hooks/player/usePlayer";
import { BsPauseFill, BsPlayFill } from "react-icons/bs";
import { HiSpeakerWave, HiSpeakerXMark } from "react-icons/hi2";
import useVolumeStore from "@/hooks/stores/useVolumeStore";
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
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const isRepeating = usePlayer((state) => state.isRepeating);
  const isShuffling = usePlayer((state) => state.isShuffling);

  // song_pathがローカルファイルパスかどうかを判定（オーディオ再生時のURL変換に使用）
  const isLocalFile = useMemo(() => isLocalFilePath(songUrl), [songUrl]);

  // ボリューム管理のカスタムフックを使用
  const { volume, setVolume } = useVolumeStore();

  const Icon = isPlaying ? BsPauseFill : BsPlayFill;
  const VolumeIcon = volume === 0 ? HiSpeakerXMark : HiSpeakerWave;

  const handlePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const handleSeek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

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

  // オーディオ要素のイベントリスナーを設定
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => {
      if (isRepeating) {
        audio.currentTime = 0;
        audio.play();
      } else {
        onPlayNext();
      }
    };

    // ローカルファイルの場合は自動再生を制御
    const handleCanPlayThrough = () => {
      if (isLocalFile) {
        // ローカルファイルの場合は明示的に再生状態をチェック
        if (isPlaying) {
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
    const handlePause = () => setIsPlaying(false);

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
  }, [songUrl, isLocalFile, isPlaying, onPlayNext, isRepeating]);

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

  const handleVolumeClick = useCallback(() => {
    setShowVolumeSlider((prev) => !prev);
  }, []);

  return {
    Icon,
    VolumeIcon,
    formattedCurrentTime,
    formattedDuration,
    volume,
    setVolume,
    showVolumeSlider,
    setShowVolumeSlider,
    handleVolumeClick,
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
