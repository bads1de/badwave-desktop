"use client";

import React, { memo, useCallback } from "react";
import Image from "next/image";
import { Song } from "@/types";
import usePlayer from "@/hooks/player/usePlayer";
import { twMerge } from "tailwind-merge";
import { Play, Heart, PlayIcon } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

interface SongListProps {
  data: Song;
  onClick?: (id: string) => void;
  className?: string;
}

const SongList: React.FC<SongListProps> = memo(
  ({ data, onClick, className }) => {
    const player = usePlayer();

    // クリックハンドラーをメモ化
    const handleClick = useCallback(() => {
      if (onClick) {
        return onClick(data.id!);
      }

      if ("author" in data && data.id) {
        return player.setId(data.id);
      }
    }, [onClick, data.id, player]);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        className={twMerge(
          `
        flex
        items-center
        gap-x-2
        sm:gap-x-4
        cursor-pointer
        w-full
        bg-gradient-to-r
        from-neutral-900/90
        to-neutral-800/80
        rounded-xl
        p-2
        group
        hover:bg-gradient-to-r
        hover:from-neutral-800/90
        hover:to-neutral-700/80
        transition-all
        duration-300
        backdrop-blur-sm
        border
        border-neutral-800/50
        `,
          className
        )}
      >
        <div
          onClick={handleClick}
          className="relative w-12 h-12 sm:w-16 sm:h-16 min-w-12 sm:min-w-16 rounded-lg overflow-hidden group-hover:shadow-lg group-hover:shadow-primary/20 transition-shadow duration-300"
        >
          {data.image_path && (
            <Image
              fill
              src={data.image_path}
              alt={data.title}
              className="object-cover transition-all duration-500 group-hover:scale-110"
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width:1280px) 25vw, 20vw"
            />
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <Play size={20} className="text-white" fill="currentColor" />
          </div>
        </div>
        <div className="flex flex-col py-1 truncate flex-grow min-w-0">
          <Link href={`/songs/${data.id}`}>
            <p className="text-white font-semibold text-xs sm:text-sm truncate tracking-wide hover:underline">
              {data.title}
            </p>
          </Link>
          <Link href={`/genre/${data.genre}`}>
            <p className="text-neutral-400 text-xs truncate mt-0.5 font-medium hover:underline">
              {data?.genre}
            </p>
          </Link>
          <p className="text-neutral-500 text-xs truncate mt-0.5 hidden sm:block">
            {data?.author}
          </p>
        </div>
        <div className="flex items-center gap-x-1 sm:gap-x-4 pr-1 sm:pr-4 ml-auto">
          <div className="flex items-center">
            <PlayIcon size={16} className="sm:size-18" />
            <span className="text-neutral-400 text-xs font-semibold ml-1">
              {data?.count}
            </span>
          </div>

          <div className="flex items-center ml-2 sm:ml-0">
            <Heart size={16} className="sm:size-18" />
            <span className="text-neutral-400 text-xs font-semibold ml-1">
              {data?.like_count}
            </span>
          </div>
        </div>
      </motion.div>
    );
  }
);

// 表示名を設定
SongList.displayName = "SongList";

export default SongList;
