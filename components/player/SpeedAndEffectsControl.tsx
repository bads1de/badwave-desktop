"use client";

import React from "react";
import * as RadixSlider from "@radix-ui/react-slider";
import usePlaybackRateStore from "@/hooks/stores/usePlaybackRateStore";
import useSpatialStore from "@/hooks/stores/useSpatialStore";
import useEffectStore, { RotationSpeed } from "@/hooks/stores/useEffectStore";
import useNightCoreStore from "@/hooks/stores/useNightCoreStore";

const SpeedAndEffectsControl: React.FC = () => {
  const playbackRate = usePlaybackRateStore((state) => state.rate);
  const setPlaybackRate = usePlaybackRateStore((state) => state.setRate);
  const { isSpatialEnabled, toggleSpatialEnabled } = useSpatialStore();
  // 8D Audio, Retro, Bass Boost, Slowed+Reverb の状態
  const is8DAudioEnabled = useEffectStore((state) => state.is8DAudioEnabled);
  const toggle8DAudio = useEffectStore((state) => state.toggle8DAudio);
  const rotationSpeed = useEffectStore((state) => state.rotationSpeed);
  const setRotationSpeed = useEffectStore((state) => state.setRotationSpeed);
  const isRetroEnabled = useEffectStore((state) => state.isRetroEnabled);
  const toggleRetro = useEffectStore((state) => state.toggleRetro);
  const isBassBoostEnabled = useEffectStore(
    (state) => state.isBassBoostEnabled,
  );
  const toggleBassBoost = useEffectStore((state) => state.toggleBassBoost);
  const isSlowedReverb = useEffectStore((state) => state.isSlowedReverb);
  const toggleSlowedReverb = useEffectStore(
    (state) => state.toggleSlowedReverb,
  );

  const isNightCore = useNightCoreStore((state) => state.isEnabled);
  const toggleNightCore = useNightCoreStore((state) => state.toggle);

  const rates = [0.9, 0.95, 1, 1.05, 1.1, 1.25];
  const rotationSpeeds: { value: RotationSpeed; label: string }[] = [
    { value: "slow", label: "Slow" },
    { value: "medium", label: "Medium" },
    { value: "fast", label: "Fast" },
  ];

  return (
    <div className="flex flex-col gap-6 min-w-[300px] font-mono">
      {/* 速度コントロール (HUD Style) */}
      <div className="flex flex-col gap-3 px-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-theme-500 font-bold uppercase tracking-widest">TEMPORAL_RATE_VAR</span>
          <span className="text-[10px] text-white font-black drop-shadow-[0_0_5px_rgba(var(--theme-500),0.5)]">
            {isNightCore ? "1.35x" : `${playbackRate.toFixed(2)}x`}
          </span>
        </div>
        <RadixSlider.Root
          className="relative flex items-center select-none touch-none w-full h-4"
          defaultValue={[1]}
          value={[playbackRate]}
          onValueChange={(value) => setPlaybackRate(value[0])}
          max={1.5}
          min={0.5}
          step={0.05}
          aria-label="Playback Speed"
          disabled={isNightCore}
        >
          <RadixSlider.Track className="relative bg-theme-900 border border-theme-500/20 rounded-none flex-grow h-1.5 overflow-hidden">
            <RadixSlider.Range className="absolute bg-theme-500 shadow-[0_0_10px_rgba(var(--theme-500),0.5)] h-full" />
          </RadixSlider.Track>
          <RadixSlider.Thumb
            className="block w-3 h-3 bg-white border border-theme-500 shadow-[0_0_8px_rgba(var(--theme-500),0.8)] focus:outline-none transition-transform hover:scale-125 cursor-pointer"
            aria-label="Speed"
          />
        </RadixSlider.Root>
        <div className="flex justify-between text-[8px] text-theme-500/40 uppercase">
          <span>0.5x_MIN</span>
          <span>1.5x_MAX</span>
        </div>
      </div>

      {/* プリセット速度ボタン (Terminal Commands) */}
        <div className="grid grid-cols-3 gap-2">
          {rates.map((rate) => (
            <button
              key={rate}
              onClick={() => setPlaybackRate(rate)}
              disabled={isNightCore}
              className={`py-2 border text-[10px] font-bold transition-all duration-300 uppercase cyber-glitch ${
                playbackRate === rate
                  ? "bg-theme-500/20 border-theme-500 text-white shadow-[0_0_10px_rgba(var(--theme-500),0.3)]"
                  : "bg-theme-500/5 border-theme-500/10 text-theme-500/60 hover:border-theme-500/40 hover:text-theme-300"
              } ${isNightCore ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {rate}x
            </button>
          ))}
        </div>

      <div className="h-px bg-theme-500/10 w-full" />

      {/* FX_MODULES */}
      <div className="space-y-4">
        {[
          { id: 'slowed', label: 'SLOWED_REVERB', desc: 'PITCH_DOWN_SPATIAL_ADD', active: isSlowedReverb, action: toggleSlowedReverb },
          { id: 'spatial', label: 'SPATIAL_SYNC', desc: 'HALL_ACOUSTICS_EMULATION', active: isSpatialEnabled, action: toggleSpatialEnabled },
          { id: '8d', label: '8D_ROTATION', desc: 'BINAURAL_SIGNAL_SWEEP', active: is8DAudioEnabled, action: toggle8DAudio },
          { id: 'retro', label: 'RETRO_SIGNAL', desc: 'ANALOG_TAPE_SATURATION', active: isRetroEnabled, action: toggleRetro },
          { id: 'bass', label: 'BASS_AMPLIFIER', desc: 'LOW_FREQ_ENHANCEMENT', active: isBassBoostEnabled, action: toggleBassBoost },
          { id: 'nightcore', label: 'NIGHTCORE', desc: 'SPEED_UP_PITCH_UP', active: isNightCore, action: toggleNightCore },
        ].map((effect) => (
          <div key={effect.id} className="group/fx relative">
            <div className="flex items-center justify-between px-1">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black tracking-widest uppercase transition-colors duration-300 ${effect.active ? "text-white" : "text-theme-500/60"}`}>
                    // {effect.label}
                  </span>
                  {effect.active && <div className="w-1 h-1 bg-theme-500 rounded-full animate-ping" />}
                </div>
                <span className="text-[7px] text-theme-500/30 uppercase tracking-tighter mt-0.5">{effect.desc}</span>
              </div>
              <button
                onClick={effect.action}
                className={`w-12 h-5 border transition-all duration-500 relative overflow-hidden ${
                  effect.active ? "bg-theme-500/20 border-theme-500 shadow-[0_0_15px_rgba(var(--theme-500),0.3)]" : "bg-theme-900/40 border-theme-500/20"
                }`}
              >
                <div
                  className={`absolute top-0.5 w-4 h-3 transition-all duration-500 ${
                    effect.active ? "left-7 bg-white shadow-[0_0_10px_white]" : "left-1 bg-theme-500/40"
                  }`}
                />
              </button>
            </div>
            
            {/* 8D Audio 回転速度 (Sub-Controls) */}
            {effect.id === '8d' && is8DAudioEnabled && (
              <div className="mt-3 ml-4 flex items-center justify-between border-l border-theme-500/20 pl-4 py-1">
                <span className="text-[8px] text-theme-500/40 uppercase">ROT_VELOCITY</span>
                <div className="flex gap-1">
                  {rotationSpeeds.map((speed) => (
                    <button
                      key={speed.value}
                      onClick={() => setRotationSpeed(speed.value)}
                      className={`px-2 py-0.5 border text-[8px] font-bold uppercase transition-all ${
                        rotationSpeed === speed.value
                          ? "bg-theme-500/40 border-theme-500 text-white"
                          : "border-theme-500/10 text-theme-500/40 hover:border-theme-500/30"
                      }`}
                    >
                      {speed.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* HUD装飾ライン */}
      <div className="mt-2 text-[7px] text-theme-500/20 font-mono text-right uppercase italic">
         signal_path: bypass_main // filter_active: true
      </div>
    </div>
  );
};

export default SpeedAndEffectsControl;
