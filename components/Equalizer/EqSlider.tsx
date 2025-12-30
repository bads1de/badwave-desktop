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
}) => {
  return (
    <div
      className={cn("flex flex-col items-center gap-2 select-none", className)}
    >
      {/* ゲイン値表示 */}
      <span className="text-xs font-mono text-neutral-400 w-8 text-center">
        {value > 0 ? `+${value}` : value}
      </span>

      {/* 縦型スライダー */}
      <SliderPrimitive.Root
        className="relative flex flex-col items-center w-6 h-24 touch-none"
        orientation="vertical"
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={([newValue]) => onChange(newValue)}
      >
        <SliderPrimitive.Track className="relative w-1.5 h-full rounded-full bg-neutral-700 overflow-hidden">
          <SliderPrimitive.Range
            className={cn(
              "absolute w-full rounded-full",
              // 値が正の場合は上方向（0から上）、負の場合は下方向（0から下）に表示
              "bg-gradient-to-t from-theme-500/50 to-theme-400"
            )}
            style={{
              // 0dBの位置を中央に、そこからゲインに応じて伸縮
              bottom:
                value >= 0 ? "50%" : `${50 - (Math.abs(value) / 12) * 50}%`,
              top: value >= 0 ? `${50 - (value / 12) * 50}%` : "50%",
            }}
          />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          className={cn(
            "block w-4 h-4 rounded-full",
            "bg-white shadow-lg",
            "border-2 border-theme-500",
            "transition-all duration-150",
            "hover:scale-110 hover:shadow-[0_0_10px_var(--glow-color)]",
            "focus:outline-none focus:ring-2 focus:ring-theme-400 focus:ring-offset-2 focus:ring-offset-[#121212]"
          )}
        />
      </SliderPrimitive.Root>

      {/* 周波数ラベル */}
      <span className="text-xs text-neutral-400 whitespace-nowrap">
        {label}
      </span>
    </div>
  );
};

export default EqSlider;
