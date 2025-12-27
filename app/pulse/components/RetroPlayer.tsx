"use client";

import { FaPlay, FaPause, FaStepBackward, FaStepForward } from "react-icons/fa";
import { MdSkipPrevious, MdSkipNext } from "react-icons/md";

interface RetroPlayerProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  isPlaying: boolean;
  togglePlay: () => void;
  volume: number;
  handleVolumeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  currentTime: number;
  duration: number;
  onSeek: (seconds: number) => void;
  onNext?: () => void;
  onPrev?: () => void;
  trackTitle?: string;
  trackGenre?: string;
  nextTrackTitle?: string;
  nextTrackGenre?: string;
}

const RetroPlayer: React.FC<RetroPlayerProps> = ({
  audioRef,
  isPlaying,
  togglePlay,
  volume,
  handleVolumeChange,
  currentTime,
  duration,
  onSeek,
  onNext,
  onPrev,
  trackTitle = "Unknown Track",
  trackGenre = "Unknown Genre",
  nextTrackTitle = "Coming Soon",
  nextTrackGenre = "...",
}) => {
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto z-10 relative">
      <div className="flex items-center gap-4 md:gap-8 mb-16 z-20 mt-20">
        <button
          className="group relative w-12 h-12 rounded-full bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-purple-400/50 transition-all active:scale-95 flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.5)]"
          onClick={onPrev}
          title="Previous Track"
        >
          <MdSkipPrevious
            className="text-purple-300 group-hover:text-purple-100 drop-shadow-[0_0_5px_rgba(128,0,255,0.8)]"
            size={28}
          />
        </button>

        <button
          className="group relative w-14 h-14 rounded-full bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-cyan-400/50 transition-all active:scale-95 flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.5)]"
          onClick={() => onSeek(-15)}
          title="-15 seconds"
        >
          <FaStepBackward
            className="text-cyan-300 group-hover:text-cyan-100 drop-shadow-[0_0_5px_rgba(0,255,255,0.8)]"
            size={20}
          />
        </button>

        <button
          onClick={togglePlay}
          className="group relative w-24 h-24 rounded-full bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-pink-500/50 transition-all active:scale-95 flex items-center justify-center shadow-[0_0_30px_rgba(255,0,255,0.3)]"
        >
          <div
            className={`absolute inset-0 rounded-full border-2 ${
              isPlaying ? "border-pink-500 animate-pulse" : "border-transparent"
            } opacity-50`}
          />

          {isPlaying ? (
            <FaPause
              className="text-pink-400 group-hover:text-pink-100 drop-shadow-[0_0_8px_rgba(255,0,255,1)]"
              size={36}
            />
          ) : (
            <FaPlay
              className="text-pink-400 group-hover:text-pink-100 drop-shadow-[0_0_8px_rgba(255,0,255,1)] ml-2"
              size={36}
            />
          )}
        </button>

        <button
          className="group relative w-14 h-14 rounded-full bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-cyan-400/50 transition-all active:scale-95 flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.5)]"
          onClick={() => onSeek(15)}
          title="+15 seconds"
        >
          <FaStepForward
            className="text-cyan-300 group-hover:text-cyan-100 drop-shadow-[0_0_5px_rgba(0,255,255,0.8)]"
            size={20}
          />
        </button>

        <button
          className="group relative w-12 h-12 rounded-full bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-purple-400/50 transition-all active:scale-95 flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.5)]"
          onClick={onNext}
          title="Next Track"
        >
          <MdSkipNext
            className="text-purple-300 group-hover:text-purple-100 drop-shadow-[0_0_5px_rgba(128,0,255,0.8)]"
            size={28}
          />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full px-4 max-w-5xl">
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-6 relative overflow-hidden group hover:border-cyan-500/30 transition-colors">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-purple-500 opacity-50" />

          <div className="flex flex-col justify-between relative z-10">
            <div className="text-cyan-400 text-xs font-mono mb-2 tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 bg-cyan-400 animate-pulse rounded-full shadow-[0_0_5px_cyan]" />
              NOW PLAYING
            </div>
            <div>
              <div className="text-white text-2xl font-bold font-sans tracking-wide uppercase drop-shadow-md">
                {trackTitle}
              </div>
              <div className="text-pink-400 text-sm font-mono mt-1 uppercase opacity-80">
                {trackGenre}
              </div>
            </div>

            <div className="mt-6 w-full h-1 bg-white/10 rounded-full relative overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-400 to-pink-500 shadow-[0_0_10px_purple]"
                style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-gray-400 font-mono mt-2">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration || 0)}</span>
            </div>
          </div>
        </div>

        <div className="bg-black/30 backdrop-blur-xl border border-white/5 rounded-xl p-6 relative overflow-hidden group hover:border-purple-500/30 transition-colors hidden md:block">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-transparent opacity-30" />

          <div className="flex gap-4 items-center relative z-10 h-full">
            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-900/50 to-black border border-white/10 flex items-center justify-center shrink-0 shadow-lg">
              <span className="text-2xl filter drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">
                🌆
              </span>
            </div>
            <div className="flex flex-col">
              <div className="text-purple-300 text-xs font-mono mb-1 tracking-widest">
                COMING UP
              </div>
              <div className="text-white/90 text-lg font-bold font-sans uppercase">
                {nextTrackTitle}
              </div>
              <div className="text-gray-500 text-xs font-mono mt-1">
                {nextTrackGenre}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RetroPlayer;
