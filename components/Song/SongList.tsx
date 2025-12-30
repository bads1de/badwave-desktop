"use client";

import React, { memo, useCallback, useMemo } from "react";
import Image from "next/image";
import { Song } from "@/types";
import usePlayer from "@/hooks/player/usePlayer";
import { twMerge } from "tailwind-merge";
import { Play, Heart, PlayIcon } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";
import useDownloadSong from "@/hooks/utils/useDownloadSong";
import { IoCloudDone, IoCloudOffline } from "react-icons/io5";
import { getPlayableImagePath } from "@/libs/songUtils";

interface SongListProps {
  data: Song;
  onClick?: (id: string) => void;
  className?: string;
}

const SongList: React.FC<SongListProps> = memo(
  ({ data, onClick, className }) => {
    const player = usePlayer();
    const { isOnline } = useNetworkStatus();

    // まずプロパティを確認、なければフックにフォールバック
    // is_downloaded が既に true なら、フックは IPC をスキップする
    const { isDownloaded: hookIsDownloaded } = useDownloadSong(data);
    const isDownloaded = data.is_downloaded ?? hookIsDownloaded;

    // オフラインかつダウンロードされていない場合は再生不可
    const isPlayable = isOnline || isDownloaded;

    // 画像パス（ダウンロード済みならローカルパスを優先）
    const imagePath = useMemo(() => getPlayableImagePath(data), [data]);

    // クリックハンドラーをメモ化
    const handleClick = useCallback(() => {
      if (!isPlayable) return; // 再生不可の場合はクリックを無視

      if (onClick) {
        return onClick(data.id!);
      }

      if ("author" in data && data.id) {
        return player.setId(data.id);
      }
    }, [onClick, data.id, player, isPlayable]);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={isPlayable ? { scale: 1.01, y: -2 } : undefined}
        className={twMerge(
          `
        flex
        items-center
        gap-x-4
        w-full
        bg-neutral-900/40
        hover:bg-neutral-800/60
        rounded-2xl
        p-3
        group
        transition-all
        duration-500
        backdrop-blur-md
        border
        border-white/[0.03]
        hover:border-theme-500/30
        hover:shadow-[0_8px_30px_rgb(0,0,0,0.4),0_0_20px_rgba(var(--theme-500),0.1)]
        ${
          isPlayable
            ? "cursor-pointer"
            : "cursor-not-allowed opacity-40 grayscale"
        }
        `,
          className
        )}
      >
        <div
          onClick={handleClick}
          className={`relative w-14 h-14 sm:w-16 sm:h-16 min-w-14 sm:min-w-16 rounded-xl overflow-hidden shadow-2xl transition-transform duration-500 ${
            isPlayable ? "group-hover:scale-105" : ""
          }`}
        >
          {imagePath && (
            <Image
              fill
              src={imagePath}
              alt={data.title}
              className={`object-cover transition-all duration-700 ${
                isPlayable ? "group-hover:scale-110" : ""
              }`}
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width:1280px) 25vw, 20vw"
            />
          )}
          {isPlayable ? (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
              <div className="bg-theme-500 p-2.5 rounded-full text-white shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                <Play size={20} fill="currentColor" />
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <IoCloudOffline size={20} className="text-gray-400" />
            </div>
          )}
        </div>

        <div className="flex flex-col py-1 truncate flex-grow min-w-0 gap-y-0.5">
          <Link
            href={`/songs/${data.id}`}
            className={!isPlayable ? "pointer-events-none" : ""}
          >
            <p
              className={`font-bold text-sm sm:text-base truncate tracking-tight transition-colors ${
                isPlayable
                  ? "text-white group-hover:text-theme-400"
                  : "text-neutral-500"
              }`}
            >
              {data.title}
            </p>
          </Link>
          <div className="flex items-center gap-x-2">
            <Link
              href={`/genre/${data.genre}`}
              className={!isPlayable ? "pointer-events-none" : ""}
            >
              <p
                className={`text-xs sm:text-sm truncate font-medium transition-colors ${
                  isPlayable
                    ? "text-neutral-400 hover:text-white"
                    : "text-neutral-600"
                }`}
              >
                {data?.genre}
              </p>
            </Link>
            <span className="text-neutral-700 text-[10px]">•</span>
            <p
              className={`text-xs sm:text-sm truncate font-medium ${
                isPlayable ? "text-neutral-500" : "text-neutral-700"
              }`}
            >
              {data?.author}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-x-3 sm:gap-x-6 pr-2 ml-auto">
          <div
            className={`flex items-center gap-x-1.5 ${
              isPlayable ? "text-neutral-400" : "text-neutral-700"
            }`}
          >
            <PlayIcon size={14} className="opacity-70" />
            <span className="text-[13px] font-bold tabular-nums">
              {data?.count}
            </span>
          </div>

          <div
            className={`flex items-center gap-x-1.5 ${
              isPlayable ? "text-neutral-400" : "text-neutral-700"
            }`}
          >
            <Heart size={14} className="opacity-70" />
            <span className="text-[13px] font-bold tabular-nums">
              {data?.like_count}
            </span>
          </div>

          {/* ダウンロード状態インジケーター */}
          {isDownloaded && (
            <div className="flex items-center">
              <div className="bg-theme-500/10 p-1.5 rounded-full border border-theme-500/20 shadow-[0_0_15px_rgba(var(--theme-500),0.2)]">
                <IoCloudDone size={16} className="text-theme-500" />
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );
  }
);

// 表示名を設定
SongList.displayName = "SongList";

export default SongList;
