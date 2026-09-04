"use client";

import { useState, memo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { getPlayableImagePath } from "@/libs/songUtils";
import { motion } from "framer-motion";
import useOnPlay from "@/hooks/player/useOnPlay";
import ScrollableContainer from "@/components/common/ScrollableContainer";
import { Song } from "@/types";

import ScrollingText from "@/components/common/ScrollingText";
import { ROUTES, DURATIONS } from "@/constants";

interface TrendBoardProps {
  className?: string;
  songs: Song[];
  isLoading?: boolean;
  error?: Error | null;
}

const TrendBoard: React.FC<TrendBoardProps> = memo(
  ({ className = "", songs = [], isLoading = false, error = null }) => {
    const [showArrows, setShowArrows] = useState(false);
    const onPlay = useOnPlay(songs);

    // マウスイベントハンドラをメモ化
    const handleMouseEnter = useCallback(() => setShowArrows(true), []);
    const handleMouseLeave = useCallback(() => setShowArrows(false), []);

    // 再生クリックハンドラをメモ化
    const handlePlay = useCallback(
      (id: string) => {
        onPlay(id);
      },
      [onPlay],
    );

    // アニメーションの設定

    const itemVariants = {
      hidden: { opacity: 0, y: 50 },
      visible: { opacity: 1, y: 0, transition: { duration: DURATIONS.NORMAL } },
    };

    return (
      <div
        className={`${className}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {isLoading ? (
          <p className="text-center text-cyan-400 animate-pulse">LOADING...</p>
        ) : error ? (
          <p className="text-red-500 text-center">{error.message}</p>
        ) : (
          <ScrollableContainer showArrows={showArrows}>
            {songs.map((song: Song, index: number) => (
              <motion.div
                key={song.id}
                variants={itemVariants}
                className="group relative transform transition-all duration-500 hover:scale-[1.03] min-w-[320px] cyber-glitch"
              >
                <div className="relative w-full h-64 overflow-hidden rounded-none bg-[#0a0a0f] border border-theme-500/20 group-hover:border-theme-500/60 shadow-[0_0_15px_rgba(var(--theme-500),0.1)] group-hover:shadow-[0_0_30px_rgba(var(--theme-500),0.3)]">
                  {/* HUDコーナー */}
                  <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-theme-500/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-theme-500/40 opacity-0 group-hover:opacity-100 transition-opacity" />

                  <Image
                    src={getPlayableImagePath(song)}
                    alt={song.title}
                    fill
                    className="group-hover:scale-125 group-hover:opacity-60 transition-all duration-700 ease-out"
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width:1280px) 25vw, 20vw"
                    style={{
                      objectFit: "cover",
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent" />

                  {/* ランキングバッジ */}
                  <div className="absolute top-4 left-4 z-20">
                    <div className="bg-theme-500/20 backdrop-blur-md border border-theme-500/40 px-3 py-1 rounded-none font-mono text-xl text-white shadow-[0_0_10px_rgba(var(--theme-500),0.4)]">
                      <span className="text-theme-400">#</span>
                      {index + 1}
                    </div>
                  </div>

                  <div
                    onClick={(e) => {
                      e.preventDefault();
                      handlePlay(song.id);
                    }}
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-500 ease-in-out cursor-pointer z-10"
                  >
                    <div className="w-16 h-16 rounded-full bg-theme-500/30 border border-theme-500 flex items-center justify-center backdrop-blur-sm shadow-[0_0_20px_rgba(var(--theme-500),0.5)]">
                      <svg
                        className="w-8 h-8 text-white fill-current drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="p-4 font-mono uppercase">
                  <h3 className="text-theme-300 text-lg font-bold mb-1 flex items-center gap-x-2 overflow-hidden group-hover:text-white transition-colors">
                    <div className="flex-1 min-w-0">
                      <Link href={ROUTES.SONGS_DETAIL(song.id)}>
                        <ScrollingText text={song.title} limitCharacters={18} />
                      </Link>
                    </div>
                  </h3>
                  <div className="text-theme-500 text-xs tracking-widest">
                    <ScrollingText
                      text={`// AUTH: ${song.author}`}
                      limitCharacters={22}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-theme-500/10">
                    <div className="text-[10px] text-theme-500/60 bg-theme-500/5 px-2 py-0.5 border border-theme-500/10">
                      PLAYS_LOG: {song.count}
                    </div>
                    <div className="w-2 h-2 bg-theme-500 animate-pulse rounded-full shadow-[0_0_8px_rgba(var(--theme-500),0.8)]" />
                  </div>
                </div>
              </motion.div>
            ))}
          </ScrollableContainer>
        )}
      </div>
    );
  },
);

// 表示名を設定
TrendBoard.displayName = "TrendBoard";

export default TrendBoard;
