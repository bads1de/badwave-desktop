import React, { useEffect, useState } from "react";
import { AiFillStepBackward, AiFillStepForward } from "react-icons/ai";
import SeekBar from "./Seekbar";
import Slider from "./Slider";
import useLocalAudioPlayer from "@/hooks/audio/useLocalAudioPlayer";
import { Song } from "@/types"; // Song型をインポート（ローカルファイル用に調整が必要な場合あり）

interface LocalPlayerContentProps {
  song: Song | null; // 現在再生中の曲情報 (ローカルファイル用に拡張する可能性あり)
  onPlayNext?: () => void; // 次の曲を再生する関数
  onPlayPrevious?: () => void; // 前の曲を再生する関数
}

const LocalPlayerContent: React.FC<LocalPlayerContentProps> = React.memo(
  ({ song, onPlayNext, onPlayPrevious }) => {
    const {
      Icon,
      VolumeIcon,
      formattedCurrentTime,
      formattedDuration,
      volume,
      setVolume,
      // audioRef, // 直接参照することは少ないので、必要なら追加
      currentTime,
      duration,
      isPlaying,
      currentSongPath,
      play,
      pause,
      togglePlayPause,
      handleSeek,
      setCurrentSongPath,
    } = useLocalAudioPlayer({ onEnded: onPlayNext }); // 再生終了時に次の曲へ

    const [showVolumeSlider, setShowVolumeSlider] = useState(false);

    // 曲が変更されたら新しいパスで再生を開始
    useEffect(() => {
      if (song && song.song_path && song.song_path !== currentSongPath) {
        setCurrentSongPath(song.song_path);
        play(song.song_path);
      } else if (!song && currentSongPath) {
        // 曲がnullになったら停止
        pause();
        setCurrentSongPath(null);
      }
    }, [song, currentSongPath, play, pause, setCurrentSongPath]);

    const handlePlayPauseClick = () => {
      if (song?.song_path) {
        togglePlayPause(song.song_path);
      } else {
        togglePlayPause(); // 曲がない場合は現在の状態をトグル（基本的には何もしないはず）
      }
    };

    const handleVolumeIconClick = () => {
      setShowVolumeSlider((prev) => !prev);
    };

    useEffect(() => {
      if (!showVolumeSlider) return;
      const timeout = setTimeout(() => {
        setShowVolumeSlider(false);
      }, 3000);
      return () => clearTimeout(timeout);
    }, [showVolumeSlider]);

    if (!song || !currentSongPath) {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 h-full bg-[#121212] border-t border-[#303030] rounded-t-xl">
          <div className="flex w-full justify-start px-4 items-center">
            <p className="text-neutral-400">曲が選択されていません</p>
          </div>
        </div>
      );
    }

    return (
      <>
        {/* audio要素はuseLocalAudioPlayerフック内で管理 */}
        <div className="grid grid-cols-2 md:grid-cols-3 h-full bg-[#121212] border-t border-[#303030] rounded-t-xl">
          <div className="flex w-full justify-start px-4">
            <div className="flex items-center gap-x-4">
              {/* ローカル用のMediaItem的なものを表示するか、曲名・アーティスト名直接表示 */}
              <div>
                <p className="text-white truncate font-semibold">
                  {song.title || song.song_path.split(/[\\/]/).pop()}
                </p>
                <p className="text-neutral-400 text-sm truncate">
                  {song.author || "不明なアーティスト"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex md:hidden col-auto w-full justify-end items-center">
            <div
              onClick={handlePlayPauseClick}
              className="h-10 w-10 flex items-center justify-center rounded-full bg-gradient-to-br from-[#08101f] to-[#0d0d0d] p-1 cursor-pointer group"
            >
              <Icon
                size={30}
                className="text-[#f0f0f0] group-hover:filter group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]"
              />
            </div>
          </div>

          <div className="hidden md:flex flex-col w-full md:justify-center items-center max-w-[722px] gap-x-6">
            <div className="flex items-center gap-x-8">
              <AiFillStepBackward
                onClick={onPlayPrevious}
                size={30}
                className="text-neutral-400 cursor-pointer hover:text-white hover:filter hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all duration-300"
              />
              <div
                onClick={handlePlayPauseClick}
                className="flex items-center justify-center h-7 w-7 rounded-full bg-gradient-to-br from-[#08101f] to-[#0d0d0d] p-1 cursor-pointer group"
              >
                <Icon
                  size={30}
                  className="text-[#f0f0f0] group-hover:filter group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                />
              </div>
              <AiFillStepForward
                onClick={onPlayNext}
                size={30}
                className="text-neutral-400 cursor-pointer hover:text-white hover:filter hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all duration-300"
              />
            </div>

            <div className="flex items-center gap-x-2 mt-4 w-full lg:max-w-[800px] md:max-w-[300px]">
              <span className="w-[50px] text-center inline-block text-[#f0f0f0]">
                {formattedCurrentTime}
              </span>
              <SeekBar
                currentTime={currentTime}
                duration={duration}
                onSeek={handleSeek}
                className="flex-1 h-2"
              />
              <span className="w-[50px] text-center inline-block text-[#f0f0f0]">
                {formattedDuration}
              </span>
            </div>
          </div>

          <div className="hidden md:flex w-full justify-end pr-6">
            <div className="flex items-center gap-x-8 w-full md:w-[100px] lg:w-[120px]">
              {/* 音量調整のみ */}
              <div className="relative">
                <VolumeIcon
                  onClick={handleVolumeIconClick}
                  className="cursor-pointer text-neutral-400 hover:text-white hover:filter hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all duration-300"
                  size={22}
                />
                <div
                  className={`absolute bottom-full rounded-xl mb-3 right-0 transition-all duration-200 z-50 bg-[#0c0c0c] p-3 shadow-[0_4px_20px_rgba(0,0,0,0.5)] border border-[#333333] ${
                    showVolumeSlider
                      ? "opacity-100 transform translate-y-0"
                      : "opacity-0 pointer-events-none transform translate-y-2"
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <Slider
                      value={volume !== null ? volume : undefined}
                      onChange={(value) => setVolume(value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
);

LocalPlayerContent.displayName = "LocalPlayerContent";

export default LocalPlayerContent;
