import React, { useEffect } from "react";
import { AiFillStepBackward, AiFillStepForward } from "react-icons/ai";
import { BsRepeat1 } from "react-icons/bs";
import { FaRandom } from "react-icons/fa";
import { MdLyrics } from "react-icons/md";
import { Playlist, Song } from "@/types";
import LikeButton from "../LikeButton";
import MediaItem from "../Song/MediaItem";
import Slider from "./Slider";
import SeekBar from "./Seekbar";
import AddPlaylist from "../Playlist/AddPlaylist";
import useAudioPlayer from "@/hooks/audio/useAudioPlayer";
import useLyricsStore from "@/hooks/stores/useLyricsStore";
import { mediaControls } from "@/libs/electron-utils";
import { isLocalSong, getPlayablePath } from "@/libs/songUtils";
import DisabledOverlay from "../common/DisabledOverlay";

interface PlayerContentProps {
  song: Song;
  playlists: Playlist[];
}

const PlayerContent: React.FC<PlayerContentProps> = React.memo(
  ({ song, playlists }) => {
    // ローカル曲かどうかを判定
    const isLocalFile = isLocalSong(song);

    // ダウンロード済みの場合はローカルパスを優先
    const playablePath = getPlayablePath(song);

    const {
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
      isRepeating,
      isShuffling,
      handlePlay,
      handleSeek,
      onPlayNext,
      onPlayPrevious,
      toggleRepeat,
      toggleShuffle,
      handleVolumeClick,
      showVolumeSlider,
      setShowVolumeSlider,
    } = useAudioPlayer(playablePath, song);
    const { toggleLyrics } = useLyricsStore();

    useEffect(() => {
      if (!showVolumeSlider) return;

      const timeout = setTimeout(() => {
        setShowVolumeSlider(false);
      }, 3000);

      return () => clearTimeout(timeout);
    }, [showVolumeSlider, setShowVolumeSlider]);

    // メディアコントロールのイベントを受け取る
    useEffect(() => {
      // Electronのメディアコントロールイベントを受け取るリスナーを登録
      const unsubscribe = mediaControls.onMediaControl((action) => {
        console.log("メディアコントロールイベントを受信:", action);

        switch (action) {
          case "play-pause":
            handlePlay();
            break;
          case "next":
            onPlayNext();
            break;
          case "previous":
            onPlayPrevious();
            break;
          default:
            console.log("未知のメディアコントロールアクション:", action);
        }
      });

      // コンポーネントのアンマウント時にリスナーを解除
      return () => {
        unsubscribe();
      };
    }, [handlePlay, onPlayNext, onPlayPrevious]);

    return (
      <>
        {/* NOTE: srcはuseAudioPlayer内で設定されるため、ここでは指定しない */}
        <audio ref={audioRef} loop={isRepeating} />

        <div className="grid grid-cols-3 h-full bg-[#121212] border-t border-[#303030] rounded-t-xl">
          <div className="flex w-full justify-start px-4">
            <div className="flex items-center gap-x-4">
              <MediaItem data={song} />
            </div>
          </div>

          <div className="flex flex-col w-full justify-center items-center max-w-[722px] gap-x-6">
            <div className="flex items-center gap-x-8">
              <FaRandom
                onClick={toggleShuffle}
                size={20}
                className={`cursor-pointer transition-all duration-300 hover:filter hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] ${
                  isShuffling
                    ? "text-theme-500 drop-shadow-[0_0_8px_var(--glow-color)] hover:drop-shadow-[0_0_12px_var(--glow-color)]"
                    : "text-neutral-400 hover:text-white"
                }`}
              />
              <AiFillStepBackward
                onClick={onPlayPrevious}
                size={30}
                className="text-neutral-400 cursor-pointer hover:text-white hover:filter hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all duration-300"
              />
              <div
                onClick={handlePlay}
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
              <BsRepeat1
                onClick={toggleRepeat}
                size={25}
                className={`cursor-pointer transition-all duration-300 hover:filter hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] ${
                  isRepeating
                    ? "text-theme-500 drop-shadow-[0_0_8px_var(--glow-color)] hover:drop-shadow-[0_0_12px_var(--glow-color)]"
                    : "text-neutral-400 hover:text-white"
                }`}
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

          <div className="flex w-full justify-end pr-6">
            <div className="flex items-center gap-x-8 w-full md:w-[170px] lg:w-[200px]">
              <DisabledOverlay disabled={isLocalFile}>
                <AddPlaylist
                  playlists={playlists}
                  songId={song.id}
                  songType="regular"
                  disabled={isLocalFile}
                  song={song}
                />
              </DisabledOverlay>

              <DisabledOverlay disabled={isLocalFile}>
                <LikeButton
                  songId={song.id}
                  songType="regular"
                  disabled={isLocalFile}
                />
              </DisabledOverlay>

              <DisabledOverlay disabled={isLocalFile}>
                <button
                  onClick={!isLocalFile ? toggleLyrics : undefined}
                  className={`transition-all duration-300 ${
                    isLocalFile
                      ? "text-neutral-600 cursor-not-allowed"
                      : "cursor-pointer text-neutral-400 hover:text-white hover:filter hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                  }`}
                  disabled={isLocalFile}
                >
                  <MdLyrics size={22} />
                </button>
              </DisabledOverlay>

              <div className="relative">
                <VolumeIcon
                  onClick={handleVolumeClick}
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

PlayerContent.displayName = "PlayerContent";

export default PlayerContent;
