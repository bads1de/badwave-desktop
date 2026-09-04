"use client";

import React, { useState, memo, useCallback } from "react";
import Image from "next/image";
import { twMerge } from "tailwind-merge";
import useGetTopPlayedSongs from "@/hooks/data/useGetTopPlayedSongs";
import useOnPlay from "@/hooks/player/useOnPlay";
import useColorSchemeStore from "@/hooks/stores/useColorSchemeStore";
import { getPlayableImagePath } from "@/libs/songUtils";

interface TopPlayedSongsProps {
  user: {
    id: string;
    full_name?: string;
    avatar_url?: string;
  } | null;
}

const PERIODS = [
  { value: "day", label: "T_DAY" },
  { value: "week", label: "T_WEEK" },
  { value: "month", label: "T_MONTH" },
  { value: "all", label: "T_ALL" },
] as const;

const TopPlayedSongs: React.FC<TopPlayedSongsProps> = memo(({ user }) => {
  const [period, setPeriod] =
    useState<(typeof PERIODS)[number]["value"]>("day");
  const { topSongs, isLoading } = useGetTopPlayedSongs(user?.id, period);
  const onPlay = useOnPlay(topSongs || []);
  const { hasHydrated } = useColorSchemeStore();

  const handlePlay = useCallback(
    (id: string) => {
      onPlay(id);
    },
    [onPlay]
  );

  return (
    <div className="relative bg-[#0a0a0f] border border-theme-500/10 p-6 rounded-none overflow-hidden group shadow-[0_0_30px_rgba(0,0,0,0.5)] font-mono">
      {/* HUD装飾 */}
      <div className="absolute top-0 right-0 w-6 h-6 border-t border-r border-theme-500/20 group-hover:border-theme-500/60 transition-all" />
      <div className="absolute bottom-0 left-0 w-6 h-6 border-b border-l border-theme-500/20 group-hover:border-theme-500/60 transition-all" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="w-1 h-1 bg-theme-500" />
            <span className="text-[10px] text-theme-500 font-black tracking-[0.4em] uppercase">METRICS_RANKING</span>
          </div>
          <h3 className="text-2xl font-black text-white uppercase tracking-widest">
            再生ランキング
          </h3>
        </div>

        <div className="w-full md:w-auto">
          <div className="flex items-center bg-black/40 border border-theme-500/10 p-1 rounded-none">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={twMerge(
                  "px-4 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all rounded-none",
                  period === p.value
                    ? "bg-theme-500 text-black shadow-[0_0_10px_rgba(var(--theme-500),0.3)]"
                    : "text-theme-500/40 hover:text-theme-500 hover:bg-theme-500/5"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-6 p-4 border border-theme-500/5 bg-theme-500/5 animate-pulse"
            >
              <div className="w-16 h-16 bg-theme-500/10 flex-shrink-0" />
              <div className="flex-grow space-y-2">
                <div className="h-3 bg-theme-500/10 w-2/3" />
                <div className="h-2 bg-theme-500/10 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : topSongs?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 border border-theme-500/5 text-theme-500/20">
          <span className="text-[10px] uppercase tracking-[0.4em] font-black">[ NULL_RECORDS_DETECTED ]</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {topSongs?.map((song, index) => (
            <div
              key={song.id}
              onClick={() => handlePlay(song.id)}
              className="group flex items-center gap-6 p-4 border border-theme-500/10 hover:border-theme-500/40 bg-black/40 hover:bg-theme-500/5 transition-all cursor-pointer relative"
            >
              <div className="flex-shrink-0 relative">
                <div className="w-16 h-16 border border-theme-500/20 p-1">
                  <div className="relative w-full h-full overflow-hidden grayscale-[30%] group-hover:grayscale-0 transition-all">
                    <Image
                      fill
                      src={getPlayableImagePath(song) || "/images/music.jpeg"}
                      alt={song.title}
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  </div>
                </div>
                <div className="absolute -top-2 -left-2 w-6 h-6 bg-theme-500 text-black font-black text-[10px] flex items-center justify-center shadow-[0_0_10px_rgba(var(--theme-500),0.5)]">
                  {index + 1}
                </div>
              </div>

              <div className="flex-grow min-w-0">
                <h4 className="text-white font-black text-xs uppercase tracking-widest truncate group-hover:text-theme-400 transition-colors">
                  {song.title}
                </h4>
                <p className="text-[9px] text-theme-500/40 uppercase tracking-widest truncate mt-1">
                  // SRC: {song.author}
                </p>
              </div>

              <div className="flex-shrink-0 flex flex-col items-end">
                <span className="text-[7px] text-theme-500/40 uppercase tracking-tighter">Play_Count</span>
                <span className="text-[10px] font-black text-theme-300 tracking-widest">
                  {song.play_count} UNITS
                </span>
              </div>
              
              {/* Decoration */}
              <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-theme-500/20 group-hover:border-theme-500/40 transition-colors" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

TopPlayedSongs.displayName = "TopPlayedSongs";

export default TopPlayedSongs;
