import React from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import * as RadixSlider from "@radix-ui/react-slider";
import { HelpCircle } from "lucide-react";
import usePlaybackRateStore from "@/hooks/stores/usePlaybackRateStore";
import useSpatialStore from "@/hooks/stores/useSpatialStore";

const PlaybackSpeedButton: React.FC = () => {
  const playbackRate = usePlaybackRateStore((state) => state.rate);
  const setPlaybackRate = usePlaybackRateStore((state) => state.setRate);
  const isSlowedReverb = usePlaybackRateStore((state) => state.isSlowedReverb);
  const setIsSlowedReverb = usePlaybackRateStore(
    (state) => state.setIsSlowedReverb
  );
  const { isSpatialEnabled, toggleSpatialEnabled } = useSpatialStore();

  const rates = [0.9, 0.95, 1, 1.05, 1.1, 1.25];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={`cursor-pointer transition-all duration-300 hover:filter hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] ${
            playbackRate !== 1 || isSlowedReverb || isSpatialEnabled
              ? "text-theme-500 drop-shadow-[0_0_8px_var(--glow-color)]"
              : "text-neutral-400 hover:text-white"
          }`}
        >
          <span className="text-xs font-bold w-6 text-center block">
            {playbackRate}x
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="center"
        sideOffset={10}
        className="w-56 p-3 bg-[#1e1e1e] border-[#333333] flex flex-col gap-3"
      >
        <div className="flex flex-col gap-2 px-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-medium">Speed</span>
            <span className="text-xs text-theme-500 font-bold">
              {playbackRate.toFixed(2)}x
            </span>
          </div>
          <RadixSlider.Root
            className="relative flex items-center select-none touch-none w-full h-5"
            defaultValue={[1]}
            value={[playbackRate]}
            onValueChange={(value) => setPlaybackRate(value[0])}
            max={1.5}
            min={0.5}
            step={0.05}
            aria-label="Playback Speed"
          >
            <RadixSlider.Track className="relative bg-neutral-600 rounded-full flex-grow h-[3px]">
              <RadixSlider.Range className="absolute bg-theme-500 rounded-full h-full" />
            </RadixSlider.Track>
            <RadixSlider.Thumb
              className="block w-3 h-3 bg-white rounded-full hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-theme-500/50 transition-transform hover:scale-110"
              aria-label="Speed"
            />
          </RadixSlider.Root>
          <div className="flex justify-between text-[10px] text-neutral-600">
            <span>0.5x</span>
            <span>1.5x</span>
          </div>
        </div>

        <div className="h-[1px] bg-neutral-800 w-full" />

        <div className="grid grid-cols-3 gap-2">
          {rates.map((rate) => (
            <button
              key={rate}
              onClick={() => setPlaybackRate(rate)}
              className={`px-2 py-1.5 rounded text-xs transition-colors text-center ${
                playbackRate === rate
                  ? "bg-theme-500/20 text-theme-500 font-medium ring-1 ring-theme-500/50"
                  : "bg-neutral-800/50 text-neutral-400 hover:bg-neutral-700 hover:text-white"
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>

        <div className="h-[1px] bg-neutral-800 w-full" />

        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-neutral-400">Slowed + Reverb</span>
            <div className="group relative flex items-center justify-center">
              <HelpCircle
                size={12}
                className="text-neutral-500 cursor-help hover:text-neutral-300 transition-colors"
              />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-[#252525] border border-[#404040] rounded shadow-xl text-[10px] leading-relaxed text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                ピッチを下げて再生速度を0.85倍にし、残響音(リバーブ)を追加して、独特の雰囲気を作り出します。
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#252525] border-b border-r border-[#404040] rotate-45"></div>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsSlowedReverb(!isSlowedReverb)}
            className={`w-8 h-4 rounded-full transition-colors relative ${
              isSlowedReverb ? "bg-theme-500" : "bg-neutral-600"
            }`}
          >
            <div
              className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${
                isSlowedReverb ? "left-4.5 translate-x-0" : "left-0.5"
              }`}
              style={{
                left: isSlowedReverb ? "calc(100% - 3px - 12px)" : "2px",
              }}
            />
          </button>
        </div>

        {/* Spatial Audio (ダンスホール) */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-neutral-400">Spatial Mode</span>
            <div className="group relative flex items-center justify-center">
              <HelpCircle
                size={12}
                className="text-neutral-500 cursor-help hover:text-neutral-300 transition-colors"
              />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-[#252525] border border-[#404040] rounded shadow-xl text-[10px] leading-relaxed text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                ダンスホールのような、低音が響き高音がこもった、反響感のあるサウンドを再現します。
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#252525] border-b border-r border-[#404040] rotate-45"></div>
              </div>
            </div>
          </div>
          <button
            onClick={toggleSpatialEnabled}
            className={`w-8 h-4 rounded-full transition-colors relative ${
              isSpatialEnabled ? "bg-theme-500" : "bg-neutral-600"
            }`}
          >
            <div
              className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${
                isSpatialEnabled ? "left-4.5 translate-x-0" : "left-0.5"
              }`}
              style={{
                left: isSpatialEnabled ? "calc(100% - 3px - 12px)" : "2px",
              }}
            />
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default PlaybackSpeedButton;
