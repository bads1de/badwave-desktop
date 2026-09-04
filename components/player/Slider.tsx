"use client";

import * as RadixSlider from "@radix-ui/react-slider";
import React from "react";

interface SliderProps {
  value?: number | undefined;
  onChange?: (value: number) => void;
}

const Slider: React.FC<SliderProps> = ({ value = 1, onChange }) => {
  const handleChange = (value: number[]) => {
    onChange?.(value[0]);
  };

  // valueがundefinedの場合はデフォルト値を使用
  const sliderValue = value !== undefined ? [value] : [1];

  return (
    <RadixSlider.Root
      className="relative flex flex-col items-center select-none touch-none h-[120px] w-6 group"
      defaultValue={[1]}
      value={sliderValue}
      onValueChange={handleChange}
      max={1}
      step={0.01}
      orientation="vertical"
      aria-label="Volume"
    >
      <RadixSlider.Track className="relative bg-[#0a0a0f] border border-theme-500/30 rounded-none w-2 h-full overflow-hidden shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]">
        {/* 背景グリッド */}
        <div className="absolute inset-0 opacity-20 pointer-events-none" 
             style={{ 
               backgroundImage: 'linear-gradient(rgba(var(--theme-500), 0.5) 1px, transparent 1px)',
               backgroundSize: '100% 10px'
             }} 
        />
        <RadixSlider.Range
          className="absolute w-full bg-gradient-to-t from-theme-500/40 via-theme-500 to-white shadow-[0_0_15px_rgba(var(--theme-500),0.8)]"
        />
      </RadixSlider.Track>
      <RadixSlider.Thumb
        className="
          block w-4 h-2 bg-white border border-theme-500 shadow-[0_0_10px_rgba(var(--theme-500),0.8)]
          focus:outline-none transition-all duration-300 group-hover:scale-x-125 cursor-pointer
        "
        aria-label="Volume Thumb"
      />
    </RadixSlider.Root>
  );
};

export default Slider;
