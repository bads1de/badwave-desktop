"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { DURATIONS } from "@/constants";

interface GenreHeaderProps {
  genre: string;
}

const GenreHeader: React.FC<GenreHeaderProps> = ({ genre }) => {
  const getIcon = () => {
    // 大文字小文字を区別せずに比較するために小文字に変換
    const genreLower = genre.toLowerCase();

    switch (genreLower) {
      case "retro wave":
        return "🌆";
      case "electro house":
        return "⚡";
      case "nu disco":
        return "💿";
      case "city pop":
        return "🏙️";
      case "tropical house":
        return "🌴";
      case "vapor wave":
        return "📼";
      case "r&b":
        return "🎤";
      case "chill house":
        return "🎧";
      default:
        return "🎵";
    }
  };

  const getBackgroundImage = () => {
    // 大文字小文字を区別せずに比較するために小文字に変換
    const genreLower = genre.toLowerCase();

    switch (genreLower) {
      case "retro wave":
        return "/images/Retro.jpg";
      case "electro house":
        return "/images/ElectroHouse.jpg";
      case "nu disco":
        return "/images/NuDisco.jpg";
      case "city pop":
        return "/images/CityPop.jpg";
      case "tropical house":
        return "/images/TropicalHouse.jpg";
      case "vapor wave":
        return "/images/VaporWave.jpg";
      case "r&b":
        return "/images/R&B.jpg";
      case "chill house":
        return "/images/ChillHouse.jpg";
      default:
        return "/images/DefaultMusic.jpg";
    }
  };

  return (
    <div className="relative w-full h-[250px] overflow-hidden border-b border-theme-500/20 font-mono">
      <div className="absolute inset-0">
        <Image
          src={getBackgroundImage()}
          alt={genre}
          fill
          className="object-cover opacity-30 grayscale blur-[2px]"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent" />
      </div>

      {/* スキャンライン */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[length:100%_4px] bg-[linear-gradient(rgba(255,255,255,0)_50%,rgba(0,0,0,0.5)_50%)]" />

      {/* コンテンツ */}
      <div className="relative h-full max-w-7xl mx-auto px-8 py-8 flex items-end">
        <div className="w-full">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: DURATIONS.NORMAL }}
            className="flex flex-col md:flex-row md:items-end justify-between gap-6"
          >
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-1.5 bg-theme-500 shadow-[0_0_15px_rgba(var(--theme-500),0.8)] animate-pulse" />
                <div>
                  <p className="text-[10px] text-theme-500 tracking-[0.6em] uppercase mb-1">
                    [ GENRE_TAG_ANALYZED ]
                  </p>
                  <div className="flex items-center gap-4">
                    <span className="text-4xl drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">
                      {getIcon()}
                    </span>
                    <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter cyber-glitch">
                      {genre}
                    </h1>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2 border-l border-theme-500/10 pl-6 md:pl-12">
              <div className="flex flex-col items-end">
                <span className="text-[8px] text-theme-500/40 uppercase tracking-widest">
                  Network_Index
                </span>
                <span className="text-xs text-theme-300 font-bold tabular-nums">
                  0x{genre.length.toString(16).toUpperCase().padStart(4, "0")}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[8px] text-theme-500/40 uppercase tracking-widest">
                  Signal_Status
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-theme-500 font-black">
                    LOCKED
                  </span>
                  <div className="w-1.5 h-1.5 bg-theme-500 rounded-full animate-ping" />
                </div>
              </div>
            </div>
          </motion.div>
          <div className="mt-8 h-px w-full bg-gradient-to-r from-theme-500/40 via-theme-500/10 to-transparent" />
        </div>
      </div>
    </div>
  );
};

export default GenreHeader;
