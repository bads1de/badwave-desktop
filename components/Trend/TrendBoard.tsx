"use client";

import { useState, memo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import useGetTrendSongs from "@/hooks/data/useGetTrendSongs";
import { motion } from "framer-motion";
import useOnPlay from "@/hooks/player/useOnPlay";
import ScrollableContainer from "@/components/common/ScrollableContainer";
import { Song } from "@/types";

interface TrendBoardProps {
  className?: string;
  selectedPeriod: "all" | "month" | "week" | "day";
  onPeriodChange: (period: "all" | "month" | "week" | "day") => void;
  initialSongs?: Song[];
}

const TrendBoard: React.FC<TrendBoardProps> = memo(
  ({ className = "", selectedPeriod, initialSongs = [] }) => {
    const [showArrows, setShowArrows] = useState(false);
    const { trends, isLoading, error } = useGetTrendSongs(
      selectedPeriod,
      initialSongs
    );
    const onPlay = useOnPlay(trends || []);

    // マウスイベントハンドラをメモ化
    const handleMouseEnter = useCallback(() => setShowArrows(true), []);
    const handleMouseLeave = useCallback(() => setShowArrows(false), []);

    // 再生クリックハンドラをメモ化
    const handlePlay = useCallback(
      (id: string) => {
        onPlay(id);
      },
      [onPlay]
    );

    // アニメーションの設定

    const itemVariants = {
      hidden: { opacity: 0, y: 50 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
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
            {trends?.map((song, index) => (
              <motion.div
                key={song.id}
                variants={itemVariants}
                className="group relative transform transition duration-300 ease-in-out hover:scale-105 min-w-[300px]"
              >
                <div className="relative w-full h-60 overflow-hidden rounded-xl bg-black shadow-lg">
                  <Image
                    src={song.image_path}
                    alt={song.title}
                    fill
                    unoptimized
                    className="rounded-t-xl group-hover:scale-110 transition duration-300 ease-in-out"
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width:1280px) 25vw, 20vw"
                    style={{
                      objectFit: "cover",
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-0 group-hover:opacity-70 transition duration-300 ease-in-out" />
                  <div
                    onClick={(e) => {
                      e.preventDefault();
                      handlePlay(song.id);
                    }}
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300 ease-in-out cursor-pointer"
                  >
                    <svg
                      className="w-12 h-12 text-[#4c1d95] fill-current"
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

                <div className="p-4">
                  <h3 className="text-white text-xl font-bold mb-1 flex items-center space-x-2">
                    <span className="text-[#4c1d95]">#{index + 1}</span>
                    <Link href={`/songs/${song.id}`}>
                      <span className="truncate hover:underline">
                        {song.title}
                      </span>
                    </Link>
                  </h3>
                  <p className="text-gray-400 text-sm">{song.author}</p>
                  <p className="text-gray-500 text-xs mt-2">
                    {song.count} plays
                  </p>
                </div>
              </motion.div>
            ))}
          </ScrollableContainer>
        )}
      </div>
    );
  }
);

// 表示名を設定
TrendBoard.displayName = "TrendBoard";

export default TrendBoard;
