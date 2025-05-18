import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import usePlayer from "@/hooks/player/usePlayer";
import { isMobile } from "react-device-detect";
import { BsPauseFill, BsPlayFill } from "react-icons/bs";
import { HiSpeakerWave, HiSpeakerXMark } from "react-icons/hi2";
import { store } from "@/libs/electron-utils";
import { ELECTRON_STORE_KEYS } from "@/constants";

/**
 * オーディオプレイヤーの状態と操作を管理するカスタムフック
 *
 * @param {string} songUrl - 再生する曲のURL
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
 */
const useAudioPlayer = (songUrl: string) => {
  const player = usePlayer();
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  // 初期値を設定せず、ローディング状態を追加
  const [volume, setVolume] = useState<number | null>(null);
  const [isVolumeLoaded, setIsVolumeLoaded] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const isRepeating = usePlayer((state) => state.isRepeating);
  const isShuffling = usePlayer((state) => state.isShuffling);
  // 前回のボリューム値を保持するRef
  const prevVolumeRef = useRef<number | null>(null);

  // 起動時にストアからボリューム設定を読み込む
  useEffect(() => {
    // すでにボリュームが読み込まれている場合は何もしない
    if (isVolumeLoaded) return;

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
        setIsVolumeLoaded(true);
      } catch (error) {
        const defaultVolume = isMobile ? 1 : 0.1;
        setVolume(defaultVolume);
        prevVolumeRef.current = defaultVolume;
        setIsVolumeLoaded(true);
      }
    };

    loadVolume();
  }, [isVolumeLoaded]);

  const Icon = isPlaying ? BsPauseFill : BsPlayFill;
  // ボリュームがnullの場合はデフォルトアイコンを表示
  const VolumeIcon =
    volume === null
      ? HiSpeakerWave
      : volume === 0
      ? HiSpeakerXMark
      : HiSpeakerWave;

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
    const handleCanPlayThrough = () => audio.play();
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("canplaythrough", handleCanPlayThrough);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("canplaythrough", handleCanPlayThrough);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
    };
  }, [songUrl]);

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
    if (!audio || volume === null) return;

    audio.volume = volume;

    // ボリューム設定をストアに保存
    const saveVolume = async () => {
      try {
        const result = await store.set(ELECTRON_STORE_KEYS.VOLUME, volume);
        // 保存した値をrefに保持
        prevVolumeRef.current = volume;
      } catch (error) {}
    };

    // 前回保存した値と異なる場合のみ保存処理を実行
    if (prevVolumeRef.current !== volume) {
      saveVolume();
    }
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !songUrl) return;

    audio.currentTime = 0;
    audio.src = songUrl;
  }, [songUrl]);

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
  };
};

export default useAudioPlayer;
