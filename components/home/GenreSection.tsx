import React from "react";
import GenreBoard from "@/components/genre/GenreBoard";

/**
 * ジャンル探索セクション
 */
const GenreSection: React.FC = () => {
  return (
    <section className="relative">
      <div className="flex items-center gap-x-4 mb-6 group/header">
        <div className="h-10 w-1 bg-theme-500 shadow-[0_0_15px_rgba(var(--theme-500),0.8)] animate-pulse" />
        <div>
          <h2 className="text-3xl font-bold text-white tracking-[0.2em] uppercase font-mono drop-shadow-[0_0_8px_rgba(var(--theme-500),0.5)]">
            GENRE_EXPLORER
          </h2>
          <p className="text-[10px] text-theme-500/60 mt-1 font-mono tracking-widest uppercase">
            // DATABASE_INDEX_READY
          </p>
        </div>
      </div>
      <div className="relative p-8 bg-[#0a0a0f]/60 border-y border-theme-500/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
        {/* 上下のグラデーション */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-theme-500/30 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-theme-500/30 to-transparent pointer-events-none" />

        <GenreBoard />
      </div>
    </section>
  );
};

export default React.memo(GenreSection);
