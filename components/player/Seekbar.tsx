import React, { ChangeEvent } from "react";

interface SeekBarProps {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  className?: string;
}

const SeekBar: React.FC<SeekBarProps> = ({
  currentTime,
  duration,
  onSeek,
  className,
}) => {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const percentage = parseFloat(event.target.value);
    const newTime = (percentage / 100) * duration;
    onSeek(newTime);
  };

  const normalizedValue = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`relative flex items-center h-6 group w-full ${className}`}>
      <input
        type="range"
        min="0"
        max="100"
        value={normalizedValue.toString()}
        onChange={handleChange}
        className="
          w-full h-full cursor-pointer appearance-none bg-transparent relative z-10
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:w-3
          [&::-webkit-slider-thumb]:h-3
          [&::-webkit-slider-thumb]:bg-white
          [&::-webkit-slider-thumb]:border-2
          [&::-webkit-slider-thumb]:border-theme-500
          [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(var(--theme-500),0.8)]
          [&::-webkit-slider-thumb]:transition-all
          [&::-webkit-slider-thumb]:duration-300
          group-hover:[&::-webkit-slider-thumb]:scale-125
        "
      />
      <div className="absolute left-0 right-0 h-1.5 bg-theme-900/40 border border-theme-500/20 pointer-events-none overflow-hidden rounded-none">
        <div
          className="h-full bg-gradient-to-r from-theme-500/60 to-theme-500 shadow-[0_0_15px_rgba(var(--theme-500),0.5)]"
          style={{ width: `${normalizedValue}%` }}
        />
        {/* 装飾用グリッド */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(90deg, rgba(var(--theme-500), 0.5) 1px, transparent 1px)",
            backgroundSize: "10px 100%",
          }}
        />
      </div>
    </div>
  );
};

export default SeekBar;
