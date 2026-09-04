"use client";

import React, { useCallback, useEffect, useState } from "react";
import { HiSpeakerWave, HiSpeakerXMark } from "react-icons/hi2";
import useVolumeStore from "@/hooks/stores/useVolumeStore";
import Slider from "./Slider";

const VolumeControl: React.FC = () => {
  const { volume, setVolume } = useVolumeStore();
  const [showSlider, setShowSlider] = useState(false);

  const VolumeIcon = volume === 0 ? HiSpeakerXMark : HiSpeakerWave;

  const handleClick = useCallback(() => {
    setShowSlider((prev) => !prev);
  }, []);

  // 3秒後に自動で閉じる
  useEffect(() => {
    if (!showSlider) return;

    const timeout = setTimeout(() => {
      setShowSlider(false);
    }, 3000);

    return () => clearTimeout(timeout);
  }, [showSlider]);

  return (
    <div className="relative">
      <VolumeIcon
        onClick={handleClick}
        className="cursor-pointer text-theme-500 hover:text-white transition-all duration-300 drop-shadow-[0_0_8px_rgba(var(--theme-500),0.6)]"
        size={20}
      />
      <div
        className={`absolute bottom-full rounded-none mb-6 right-[-8px] transition-all duration-500 z-[100] bg-[#0a0a0f]/95 backdrop-blur-xl p-5 shadow-[0_0_40px_rgba(0,0,0,0.9),0_0_20px_rgba(var(--theme-500),0.15)] border border-theme-500/40 ${
          showSlider
            ? "opacity-100 transform translate-y-0 scale-100"
            : "opacity-0 pointer-events-none transform translate-y-4 scale-95"
        }`}
      >
        {/* HUD装飾コーナー */}
        <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-theme-500/60" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-theme-500/60" />

        <div className="flex flex-col items-center gap-y-3">
          <Slider value={volume !== null ? volume : undefined} onChange={(value) => setVolume(value)} />
          <div className="h-px w-full bg-theme-500/20 my-1" />
          <span className="text-[9px] font-mono text-white font-black uppercase tracking-widest drop-shadow-[0_0_5px_rgba(var(--theme-500),0.5)]">
            {Math.round((volume || 0) * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default VolumeControl;
