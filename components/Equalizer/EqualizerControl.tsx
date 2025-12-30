"use client";

import React from "react";
import useEqualizerStore, { EQ_BANDS } from "@/hooks/stores/useEqualizerStore";
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

/**
 * イコライザーコントロール メイン UI
 * プリセット選択、ON/OFF切り替え、6バンドスライダー、周波数カーブを含む
 */
const EqualizerControl: React.FC = () => {
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

  return (
    <div className="flex flex-col gap-4 p-4 bg-[#1a1a1a] rounded-xl border border-[#333] min-w-[320px]">
      {/* ヘッダー: ON/OFF と プリセット選択 */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Switch
            checked={isEnabled}
            onCheckedChange={toggleEnabled}
            className="data-[state=checked]:bg-theme-500"
          />
          <span className="text-sm font-medium text-neutral-200">
            イコライザー
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Select value={activePresetId} onValueChange={setPreset}>
            <SelectTrigger className="w-32 h-8 bg-[#252525] border-[#404040] text-sm">
              <SelectValue placeholder="プリセット" />
            </SelectTrigger>
            <SelectContent className="bg-[#252525] border-[#404040]">
              {presets.map((preset) => (
                <SelectItem
                  key={preset.id}
                  value={preset.id}
                  className="text-sm hover:bg-[#333]"
                >
                  {preset.name}
                </SelectItem>
              ))}
              {activePresetId === "custom" && (
                <SelectItem value="custom" className="text-sm hover:bg-[#333]">
                  Custom
                </SelectItem>
              )}
            </SelectContent>
          </Select>

          <button
            onClick={reset}
            className="px-2 py-1 text-xs text-neutral-400 hover:text-white transition-colors"
          >
            リセット
          </button>
        </div>
      </div>

      {/* 周波数カーブ */}
      <FrequencyCurve bands={bands} isEnabled={isEnabled} />

      {/* スライダー群 */}
      <div className="flex justify-between gap-2">
        {bands.map((band, index) => (
          <EqSlider
            key={band.freq}
            value={band.gain}
            onChange={(value) => setGain(band.freq, value)}
            label={EQ_BANDS[index].label}
          />
        ))}
      </div>

      {/* フッター: ガイドラベル */}
      <div className="flex justify-between text-xs text-neutral-500 px-2">
        <span>低音</span>
        <span>高音</span>
      </div>
    </div>
  );
};

export default EqualizerControl;
