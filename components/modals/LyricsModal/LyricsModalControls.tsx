"use client";

import React from "react";
import { BsPauseFill, BsPlayFill } from "react-icons/bs";
import { AiFillStepBackward, AiFillStepForward } from "react-icons/ai";
import SeekBar from "@/components/player/Seekbar";

interface LyricsModalControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  formattedCurrentTime: string;
  formattedDuration: string;
  handlePlay: () => void;
  handleSeek: (time: number) => void;
  onPlayPrevious: () => void;
  onPlayNext: () => void;
}

const LyricsModalControls: React.FC<LyricsModalControlsProps> = ({
  isPlaying,
  currentTime,
  duration,
  formattedCurrentTime,
  formattedDuration,
  handlePlay,
  handleSeek,
  onPlayPrevious,
  onPlayNext,
}) => {
  const Icon = isPlaying ? BsPauseFill : BsPlayFill;

  return (
    <div className="w-full px-8 py-4 bg-black/60 backdrop-blur-xl border-t border-white/5">
      {/* 繧ｷ繝ｼ繧ｯ繝舌・ */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs text-neutral-400 w-10 text-right tabular-nums">
          {formattedCurrentTime}
        </span>
        <SeekBar
          currentTime={currentTime}
          duration={duration}
          onSeek={handleSeek}
          className="flex-1 h-1"
        />
        <span className="text-xs text-neutral-400 w-10 tabular-nums">
          {formattedDuration}
        </span>
      </div>

      {/* 繧ｳ繝ｳ繝医Ο繝ｼ繝ｫ繝懊ち繝ｳ */}
      <div className="flex items-center justify-center gap-8">
        {/* 蜑阪・譖ｲ */}
        <button
          onClick={onPlayPrevious}
          className="text-neutral-400 hover:text-white transition-all duration-200 hover:scale-110"
          aria-label="Previous"
        >
          <AiFillStepBackward size={28} />
        </button>

        {/* 蜀咲函/荳譎ょ●豁｢ */}
        <button
          onClick={handlePlay}
          className="w-14 h-14 flex items-center justify-center rounded-full bg-white hover:bg-neutral-200 transition-all duration-200 hover:scale-105 shadow-lg shadow-white/20"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          <Icon size={28} className="text-black" />
        </button>

        {/* 谺｡縺ｮ譖ｲ */}
        <button
          onClick={onPlayNext}
          className="text-neutral-400 hover:text-white transition-all duration-200 hover:scale-110"
          aria-label="Next"
        >
          <AiFillStepForward size={28} />
        </button>
      </div>
    </div>
  );
};

export default LyricsModalControls;

