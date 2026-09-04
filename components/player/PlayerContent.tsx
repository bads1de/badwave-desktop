import React, { useEffect } from "react";
import { twMerge } from "tailwind-merge";
import { AiFillStepBackward, AiFillStepForward } from "react-icons/ai";
import { BsPauseFill, BsPlayFill, BsRepeat1 } from "react-icons/bs";
import { FaRandom } from "react-icons/fa";
import { Mic2 } from "lucide-react";
import { Playlist, Song } from "@/types";
import LikeButton from "../LikeButton";
import MediaItem from "../song/MediaItem";
import SeekBar from "./Seekbar";
import AddPlaylist from "../playlist/AddPlaylist";
import useAudioPlayer from "@/hooks/audio/useAudioPlayer";
import useAudioEqualizer from "@/hooks/audio/useAudioEqualizer";
import useLyricsStore from "@/hooks/stores/useLyricsStore";
import useLyricsModalStore from "@/hooks/stores/useLyricsModalStore";
import usePlaybackRate from "@/hooks/audio/usePlaybackRate";
import useAudioEffects from "@/hooks/audio/useAudioEffects";
import useColorSchemeStore from "@/hooks/stores/useColorSchemeStore";
import { mediaControls } from "@/libs/electron";
import { isLocalSong, getPlayablePath } from "@/libs/songUtils";
import DisabledOverlay from "../common/DisabledOverlay";
import VolumeControl from "./VolumeControl";
import MiniPlayerButton from "./MiniPlayerButton";
import AudioSettingsButton from "./AudioSettingsButton";
import { useDiscordRpc } from "@/hooks/utils/useDiscordRpc";
import { useMiniPlayerSync } from "@/hooks/utils/useMiniPlayerSync";
import { useMediaControl } from "@/hooks/utils/useMediaControl";

interface PlayerContentProps {
  song: Song;
  playlists: Playlist[];
}

const PlayerContent: React.FC<PlayerContentProps> = React.memo(
  ({ song, playlists }) => {
    // ローカル曲かどうかを判定
    const isLocalFile = isLocalSong(song);

    // 繝繧ｦ繝ｳ繝ｭ繝ｼ繝画ｸ医∩縺ｮ蝣ｴ蜷医・繝ｭ繝ｼ繧ｫ繝ｫ繝代せ繧貞━蜈・
    const playablePath = getPlayablePath(song);

    // カラースキームを取得
    const { getColorScheme, hasHydrated } = useColorSchemeStore();
    const colorScheme = getColorScheme();

    // 繧ｫ繝ｩ繝ｼ繧ｹ繧ｭ繝ｼ繝槭°繧峨・濶ｲ蜿門ｾ暦ｼ医ワ繧､繝峨Ξ繝ｼ繧ｷ繝ｧ繝ｳ蜑阪・繝・ヵ繧ｩ繝ｫ繝亥､繧剃ｽｿ逕ｨ・・
    const accentFrom = hasHydrated ? colorScheme.colors.accentFrom : "#7c3aed";
    const primary = hasHydrated ? colorScheme.colors.primary : "#4c1d95";
    const glowColor = hasHydrated
      ? `rgba(${colorScheme.colors.glow}, 0.8)`
      : "rgba(139, 92, 246, 0.8)";

    const {
      formattedCurrentTime,
      formattedDuration,
      currentTime,
      duration,
      isPlaying,
      handlePlay,
      handleSeek,
      onPlayNext,
      onPlayPrevious,
      toggleRepeat,
      toggleShuffle,
      isRepeating,
      isShuffling,
    } = useAudioPlayer(playablePath, song);

    // Discord Rich Presence の更新
    useDiscordRpc({
      song,
      isPlaying,
      duration,
      currentTime,
    });

    const Icon = isPlaying ? BsPauseFill : BsPlayFill;

    // イコライザーと再生速度、その他エフェクトを適用（AudioEngineを使用）
    useAudioEqualizer();
    usePlaybackRate();
    useAudioEffects();

    // ミニプレイヤーに曲情報を同期
    useMiniPlayerSync({ song, isPlaying });

    const { toggleLyrics } = useLyricsStore();
    const { openModal } = useLyricsModalStore();

    // 繝｡繝・ぅ繧｢繧ｳ繝ｳ繝医Ο繝ｼ繝ｫ・医Α繝九・繝ｬ繧､繝､繝ｼ蜷ｫ繧・峨・繧､繝吶Φ繝医ｒ蜿励￠蜿悶ｋ
    useMediaControl({
      onPlayPause: handlePlay,
      onNext: onPlayNext,
      onPrevious: onPlayPrevious,
    });

    return (
      <>
        {/* audio隕∫ｴ縺ｯAudioEngine繧ｷ繝ｳ繧ｰ繝ｫ繝医Φ縺ｧ邂｡逅・＆繧後ｋ縺溘ａ縲√％縺薙↓縺ｯ荳崎ｦ・*/}
        <div className="grid grid-cols-3 h-full bg-transparent">
          <div className="flex w-full justify-start px-4">
            <div className="flex items-center gap-x-4">
              <MediaItem data={song} onClick={openModal} />
            </div>
          </div>

          <div className="flex flex-col w-full justify-center items-center max-w-[600px] mx-auto font-mono">
            <div className="flex items-center gap-x-12">
              <div className="group relative">
                <FaRandom
                  onClick={toggleShuffle}
                  size={18}
                  className={twMerge(
                    "cursor-pointer transition-all duration-300",
                    isShuffling
                      ? "text-white drop-shadow-[0_0_10px_rgba(var(--theme-500),0.8)]"
                      : "text-theme-500/40 hover:text-white",
                  )}
                />
                {isShuffling && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-theme-500 rounded-none animate-pulse" />
                )}
              </div>

              <AiFillStepBackward
                onClick={onPlayPrevious}
                size={28}
                className="text-theme-500/60 cursor-pointer hover:text-white transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(var(--theme-500),0.5)]"
              />

              <div
                onClick={handlePlay}
                className="relative flex items-center justify-center h-12 w-12 cursor-pointer group/play transition-all duration-500"
              >
                {/* 閭梧勹陬・｣ｾ */}
                <div className="absolute inset-0 border border-theme-500/20 group-hover/play:border-theme-500/40" />
                <div className="absolute inset-1 border border-theme-500/40 group-hover/play:border-theme-500/80 transition-colors" />

                <div
                  className={twMerge(
                    "flex items-center justify-center rounded-none transition-all duration-500 shadow-[0_0_20px_rgba(var(--theme-500),0.3)] group-hover/play:shadow-[0_0_30px_rgba(var(--theme-500),0.6)] group-hover/play:scale-110 cyber-glitch h-10 w-10 bg-theme-500/20 border border-theme-500/60",
                  )}
                >
                  <Icon
                    size={28}
                    className="text-white group-hover/play:drop-shadow-[0_0_8px_white] transition-all duration-300"
                  />
                </div>
                {/* コーナー装飾 */}
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-theme-500/40 group-hover/play:border-theme-500" />
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-theme-500/40 group-hover/play:border-theme-500" />
              </div>

              <AiFillStepForward
                onClick={onPlayNext}
                size={28}
                className="text-theme-500/60 cursor-pointer hover:text-white transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(var(--theme-500),0.5)]"
              />

              <div className="group relative">
                <BsRepeat1
                  onClick={toggleRepeat}
                  size={22}
                  className={twMerge(
                    "cursor-pointer transition-all duration-300",
                    isRepeating
                      ? "text-white drop-shadow-[0_0_10px_rgba(var(--theme-500),0.8)]"
                      : "text-theme-500/40 hover:text-white",
                  )}
                />
                {isRepeating && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-theme-500 rounded-none animate-pulse" />
                )}
              </div>
            </div>

            <div className="flex items-center gap-x-4 mt-4 w-full lg:max-w-[700px] md:max-w-[300px] font-mono text-[10px] tracking-[0.3em] uppercase">
              <span className="w-[60px] text-right text-theme-500 font-bold opacity-80">
                {formattedCurrentTime}
              </span>
              <SeekBar
                currentTime={currentTime}
                duration={duration}
                onSeek={handleSeek}
                className="flex-1 h-1"
              />
              <span className="w-[60px] text-left text-theme-500/50">
                {formattedDuration}
              </span>
            </div>
          </div>

          <div className="flex w-full justify-end pr-16">
            <div className="flex items-center gap-x-6 md:w-[220px] lg:w-[260px]">
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
                  size={20}
                />
              </DisabledOverlay>

              <DisabledOverlay disabled={isLocalFile}>
                <button
                  onClick={!isLocalFile ? toggleLyrics : undefined}
                  className={twMerge(
                    "transition-all duration-300",
                    isLocalFile
                      ? "text-neutral-600 cursor-not-allowed"
                      : "cursor-pointer text-theme-500/60 hover:text-white hover:drop-shadow-[0_0_8px_rgba(var(--theme-500),0.8)]",
                  )}
                  disabled={isLocalFile}
                >
                  <Mic2 size={20} />
                </button>
              </DisabledOverlay>

              {/* オーディオ設定 (速度・エフェクト・イコライザー) */}
              <AudioSettingsButton />

              {/* ミニプレイヤーボタン */}
              <MiniPlayerButton />

              {/* 音量コントロール */}
              <VolumeControl />
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </>
    );
  },
);

PlayerContent.displayName = "PlayerContent";

export default PlayerContent;

