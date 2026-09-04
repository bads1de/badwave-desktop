"use client";

import React, { useState } from "react";
import { Settings2, Music2, SlidersVertical } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import usePlaybackRateStore from "@/hooks/stores/usePlaybackRateStore";
import useEqualizerStore from "@/hooks/stores/useEqualizerStore";
import useEffectStore from "@/hooks/stores/useEffectStore";
import useSpatialStore from "@/hooks/stores/useSpatialStore";
import useNightCoreStore from "@/hooks/stores/useNightCoreStore";
import SpeedAndEffectsControl from "./SpeedAndEffectsControl";
import EqualizerControl from "../equalizer/EqualizerControl";

type Tab = "effects" | "equalizer";

const AudioSettingsButton: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>("effects");

  // オーディオ設定が有効かどうかをチェックしてアイコンの色を変えるためのstate
  const playbackRate = usePlaybackRateStore((state) => state.rate);
  const isEqualizerEnabled = useEqualizerStore((state) => state.isEnabled);
  const isSpatialEnabled = useSpatialStore((state) => state.isSpatialEnabled);
  const is8DAudioEnabled = useEffectStore((state) => state.is8DAudioEnabled);
  const isRetroEnabled = useEffectStore((state) => state.isRetroEnabled);
  const isBassBoostEnabled = useEffectStore(
    (state) => state.isBassBoostEnabled,
  );
  const isSlowedReverb = useEffectStore((state) => state.isSlowedReverb);
  const isNightCore = useNightCoreStore((state) => state.isEnabled);

  const isAnyEffectActive =
    playbackRate !== 1 ||
    isEqualizerEnabled ||
    isSpatialEnabled ||
    is8DAudioEnabled ||
    isRetroEnabled ||
    isBassBoostEnabled ||
    isSlowedReverb ||
    isNightCore;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={`cursor-pointer transition-all duration-300 hover:filter hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] ${
            isAnyEffectActive
              ? "text-theme-500 drop-shadow-[0_0_8px_var(--glow-color)]"
              : "text-neutral-400 hover:text-white"
          }`}
          title="オーディオ設定 (速度・エフェクト・イコライザー)"
          data-testid="audio-settings-button"
        >
          <Settings2 size={20} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="center"
        sideOffset={10}
        className="w-[380px] p-0 bg-[#0a0a0f]/95 backdrop-blur-2xl border border-theme-500/20 shadow-[0_0_40px_rgba(0,0,0,0.8)] rounded-xl overflow-hidden relative"
      >
        {/* HUD装飾コーナー */}
        <div className="absolute top-0 right-0 w-6 h-6 border-t border-r border-theme-500/20 pointer-events-none z-20" />
        <div className="absolute bottom-0 left-0 w-6 h-6 border-b border-l border-theme-500/20 pointer-events-none z-20" />

        {/* タブヘッダー */}
        <div className="flex border-b border-theme-500/10 font-mono relative z-10">
          <button
            onClick={() => setActiveTab("effects")}
            className={`flex-1 flex items-center justify-center gap-2 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
              activeTab === "effects"
                ? "bg-theme-500/10 text-theme-500"
                : "text-theme-500/40 hover:text-theme-500/60 hover:bg-theme-500/5"
            }`}
          >
            <Music2 size={14} />
            <span>EFFECTS_STREAM</span>
          </button>
          <button
            onClick={() => setActiveTab("equalizer")}
            className={`flex-1 flex items-center justify-center gap-2 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
              activeTab === "equalizer"
                ? "bg-theme-500/10 text-theme-500"
                : "text-theme-500/40 hover:text-theme-500/60 hover:bg-theme-500/5"
            }`}
          >
            <SlidersVertical size={14} />
            <span>EQ_PROCESSOR</span>
          </button>
        </div>

        {/* コンテンツエリア */}
        <div className="p-6 max-h-[450px] overflow-y-auto custom-scrollbar relative z-10">
          {activeTab === "effects" ? (
            <SpeedAndEffectsControl />
          ) : (
            <EqualizerControl className="!bg-transparent !border-none !rounded-none !p-0 !min-w-0 !shadow-none" />
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default AudioSettingsButton;

