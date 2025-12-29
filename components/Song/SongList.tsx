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
        whileHover={isPlayable ? { scale: 1.02 } : undefined}
        className={twMerge(
          `
        flex
        items-center
        gap-x-2
        sm:gap-x-4
        w-full
        bg-gradient-to-r
        from-neutral-900/90
        to-neutral-800/80
        rounded-xl
        p-2
        group
        transition-all
        duration-300
        backdrop-blur-sm
        border
        border-neutral-800/50
        ${
          isPlayable
            ? "cursor-pointer hover:from-neutral-800/90 hover:to-neutral-700/80"
            : "cursor-not-allowed opacity-60"
        }
        `,
          className
        )}
      >
        <div
          onClick={handleClick}
          className={`relative w-12 h-12 sm:w-16 sm:h-16 min-w-12 sm:min-w-16 rounded-lg overflow-hidden transition-shadow duration-300 ${
            isPlayable
              ? "group-hover:shadow-lg group-hover:shadow-primary/20"
              : ""
          }`}
        >
          {imagePath && (
            <Image
              fill
              src={imagePath}
              alt={data.title}
              className={`object-cover transition-all duration-500 ${
                isPlayable ? "group-hover:scale-110" : "grayscale"
              }`}
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width:1280px) 25vw, 20vw"
            />
          )}
          {isPlayable ? (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <Play size={20} className="text-white" fill="currentColor" />
            </div>
          ) : (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <IoCloudOffline size={20} className="text-gray-400" />
            </div>
          )}
        </div>
        <div className="flex flex-col py-1 truncate flex-grow min-w-0">
          <Link
            href={`/songs/${data.id}`}
            className={!isPlayable ? "pointer-events-none" : ""}
          >
            <p
              className={`font-semibold text-xs sm:text-sm truncate tracking-wide ${
                isPlayable ? "text-white hover:underline" : "text-gray-500"
              }`}
            >
              {data.title}
            </p>
          </Link>
          <Link
            href={`/genre/${data.genre}`}
            className={!isPlayable ? "pointer-events-none" : ""}
          >
            <p
              className={`text-xs truncate mt-0.5 font-medium ${
                isPlayable
                  ? "text-neutral-400 hover:underline"
                  : "text-gray-600"
              }`}
            >
              {data?.genre}
            </p>
          </Link>
          <p
            className={`text-xs truncate mt-0.5 hidden sm:block ${
              isPlayable ? "text-neutral-500" : "text-gray-600"
            }`}
          >
            {data?.author}
          </p>
        </div>
        <div className="flex items-center gap-x-1 sm:gap-x-4 pr-1 sm:pr-4 ml-auto">
          <div
            className={`flex items-center ${isPlayable ? "" : "text-gray-600"}`}
          >
            <PlayIcon size={16} className="sm:size-18" />
            <span
              className={`text-xs font-semibold ml-1 ${
                isPlayable ? "text-neutral-400" : "text-gray-600"
              }`}
            >
              {data?.count}
            </span>
          </div>

          <div
            className={`flex items-center ml-2 sm:ml-0 ${
              isPlayable ? "" : "text-gray-600"
            }`}
          >
            <Heart size={16} className="sm:size-18" />
            <span
              className={`text-xs font-semibold ml-1 ${
                isPlayable ? "text-neutral-400" : "text-gray-600"
              }`}
            >
              {data?.like_count}
            </span>
          </div>

          {/* ダウンロード状態インジケーター */}
          {isDownloaded && (
            <div className="flex items-center ml-2 sm:ml-0">
              <IoCloudDone
                size={16}
                className="text-theme-500 drop-shadow-[0_0_8px_rgba(var(--theme-500),0.6)]"
              />
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
