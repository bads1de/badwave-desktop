"use client";

import React from "react";
import useEqualizerStore, { EQ_BANDS } from "@/hooks/stores/useEqualizerStore";
import useColorSchemeStore from "@/hooks/stores/useColorSchemeStore";
import EqSlider from "./EqSlider";
import FrequencyCurve from "./FrequencyCurve";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EqualizerControlProps {
  className?: string;
}

/**
 * イコライザーコントロール メイン UI
 * プリセット選択、ON/OFF切り替え、6バンドスライダー、周波数カーブを含む
 */
const EqualizerControl: React.FC<EqualizerControlProps> = ({ className }) => {
  const {
    isEnabled,
    bands,
    activePresetId,
    presets,
    setGain,
    setPreset,
    toggleEnabled,
    reset,
  } = useEqualizerStore();

  const { getColorScheme, hasHydrated } = useColorSchemeStore();
  const colorScheme = getColorScheme();

  // カラースキームからアクセントカラーを取得（ハイドレーション前はデフォルト値）
  const accentFrom = hasHydrated ? colorScheme.colors.accentFrom : "#7c3aed";
  const accentTo = hasHydrated ? colorScheme.colors.accentTo : "#ec4899";

  return (
    <div
      className={`flex flex-col gap-6 p-6 bg-[#0a0a0f] border border-theme-500/20 shadow-[0_0_30px_rgba(0,0,0,0.8),inset_0_0_15px_rgba(var(--theme-500),0.05)] min-w-[340px] font-mono relative group ${className}`}
    >
      {/* HUDコーナー */}
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-theme-500/40 rounded-tr-xl" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-theme-500/40 rounded-bl-xl" />

      {/* ヘッダー: ON/OFF と プリセット選択 */}
      <div className="flex items-center justify-between gap-4 border-b border-theme-500/10 pb-4 relative z-10">
        <div className="flex items-center gap-3">
          <Switch
            checked={isEnabled}
            onCheckedChange={toggleEnabled}
            className="data-[state=checked]:bg-theme-500"
          />
          <span className={`text-[10px] font-black uppercase tracking-widest transition-colors duration-300 ${isEnabled ? "text-white" : "text-theme-500/40"}`}>
            SIGNAL_EQ
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Select value={activePresetId} onValueChange={setPreset}>
            <SelectTrigger className="w-28 h-8 bg-[#0a0a0f] border-theme-500/30 text-[10px] uppercase tracking-tighter rounded-none focus:ring-theme-500/40">
              <SelectValue placeholder="PRESET" />
            </SelectTrigger>
            <SelectContent className="bg-[#0a0a0f]/95 border-theme-500/40 rounded-none">
              {presets.map((preset) => (
                <SelectItem
                  key={preset.id}
                  value={preset.id}
                  className="text-[10px] font-mono uppercase tracking-widest focus:bg-theme-500/20 focus:text-white"
                >
                  {preset.name}
                </SelectItem>
              ))}
              {activePresetId === "custom" && (
                <SelectItem value="custom" className="text-[10px] font-mono uppercase tracking-widest">
                  [ CUSTOM ]
                </SelectItem>
              )}
            </SelectContent>
          </Select>

          <button
            onClick={reset}
            className="px-2 py-1 text-[8px] font-black text-theme-500/40 hover:text-white transition-all uppercase tracking-widest"
          >
            [ ABORT ]
          </button>
        </div>
      </div>

      {/* 周波数カーブ */}
      <div className="relative group">
        <div className="absolute inset-0 bg-theme-500/5 blur-xl group-hover:bg-theme-500/10 transition-colors" />
        <FrequencyCurve 
          bands={bands} 
          isEnabled={isEnabled} 
          accentFrom={accentFrom}
          accentTo={accentTo}
        />
      </div>

      {/* スライダー群 */}
      <div className="flex justify-between gap-2 px-2">
        {bands.map((band, index) => (
          <EqSlider
            key={band.freq}
            value={band.gain}
            onChange={(value) => setGain(band.freq, value)}
            label={EQ_BANDS[index].label}
            accentFrom={accentFrom}
            accentTo={accentTo}
          />
        ))}
      </div>

      {/* フッター: ガイドラベル */}
      <div className="flex justify-between text-[8px] font-black text-theme-500/20 px-4 uppercase tracking-[0.2em]">
        <span>// LOW_END</span>
        <span>// HIGH_END</span>
      </div>
    </div>
  );
};

export default EqualizerControl;
