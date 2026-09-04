"use client";

import React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/libs/utils";

interface EqSliderProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  /** カラースキームのアクセントカラー（From） */
  accentFrom?: string;
  /** カラースキームのアクセントカラー（To） */
  accentTo?: string;
}

/**
 * 縦型イコライザースライダー
 * -12dB ~ +12dB の範囲でゲイン調整
 */
const EqSlider: React.FC<EqSliderProps> = ({
  value,
  onChange,
  label,
  min = -12,
  max = 12,
  step = 1,
  className,
  accentFrom = "#7c3aed",
  accentTo = "#ec4899",
}) => {
  return (
    <div
      className={cn("flex flex-col items-center gap-3 select-none font-mono", className)}
    >
      {/* ゲイン値表示 */}
      <span className="text-[10px] font-black text-theme-500 w-8 text-center drop-shadow-[0_0_5px_rgba(var(--theme-500),0.5)]">
        {value > 0 ? `+${value}` : value}
      </span>

      {/* 縦型スライダー (HUD Style) */}
      <SliderPrimitive.Root
        className="relative flex flex-col items-center w-6 h-32 touch-none group"
        orientation="vertical"
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={([newValue]) => onChange(newValue)}
      >
        <SliderPrimitive.Track className="relative w-2 h-full bg-[#0a0a0f] border border-theme-500/30 overflow-hidden shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]">
          {/* センターライン */}
          <div className="absolute top-1/2 left-0 w-full h-px bg-theme-500/20 z-0" />
          
          <SliderPrimitive.Range
            className="absolute w-full bg-gradient-to-t from-theme-500/40 via-theme-500 to-white shadow-[0_0_15px_rgba(var(--theme-500),0.8)]"
            style={{
              // 0dBの位置を中央に
              bottom: value >= 0 ? "50%" : `${50 - (Math.abs(value) / 12) * 50}%`,
              top: value >= 0 ? `${50 - (value / 12) * 50}%` : "50%",
            }}
          />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          className={cn(
            "block w-4 h-2 bg-white border border-theme-500 shadow-[0_0_10px_rgba(var(--theme-500),0.8)]",
            "focus:outline-none transition-all duration-300",
            "group-hover:scale-x-125 cursor-pointer"
          )}
          aria-label="Gain Thumb"
        />
      </SliderPrimitive.Root>

      {/* 周波数ラベル */}
      <span className="text-[8px] font-bold text-theme-500/60 whitespace-nowrap uppercase tracking-widest">
        {label}
      </span>
    </div>
  );
};

export default EqSlider;
