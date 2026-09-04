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
import { ROUTES } from "@/constants";

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
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={twMerge(
          `
        flex
        items-center
        gap-x-4
        w-full
        bg-[#0a0a0f]
        hover:bg-theme-500/5
        rounded-none
        p-3
        group
        transition-all
        duration-500
        backdrop-blur-md
        border
        border-theme-500/10
        hover:border-theme-500/40
        hover:shadow-[0_0_20px_rgba(var(--theme-500),0.1)]
        relative
        cyber-glitch
        font-mono
        ${
          isPlayable
            ? "cursor-pointer"
            : "cursor-not-allowed opacity-40 grayscale"
        }
        `,
          className
        )}
      >
        {/* HUD装飾コーナー */}
        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-theme-500/0 group-hover:border-theme-500/40 transition-colors" />
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-theme-500/0 group-hover:border-theme-500/40 transition-colors" />

        <div
          onClick={handleClick}
          className={`relative w-14 h-14 sm:w-16 sm:h-16 min-w-14 sm:min-w-16 rounded-none overflow-hidden border border-theme-500/20 shadow-2xl transition-all duration-500 ${
            isPlayable
              ? "group-hover:scale-105 group-hover:border-theme-500/60"
              : ""
          }`}
        >
          {imagePath && (
            <Image
              fill
              src={imagePath}
              alt={data.title}
              className={`object-cover transition-all duration-700 opacity-80 group-hover:opacity-100 ${
                isPlayable ? "group-hover:scale-110" : ""
              }`}
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width:1280px) 25vw, 20vw"
            />
          )}

          {isPlayable ? (
            <div className="absolute inset-0 bg-theme-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[1px]">
              <div className="bg-black/80 border border-theme-500/60 p-2 text-theme-500 shadow-[0_0_15px_rgba(var(--theme-500),0.4)] transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                <Play size={18} fill="currentColor" />
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <IoCloudOffline size={20} className="text-theme-500/40" />
            </div>
          )}
        </div>

        <div className="flex flex-col py-1 truncate flex-grow min-w-0 gap-y-0.5">
          <Link
            href={ROUTES.SONGS_DETAIL(data.id)}
            className={!isPlayable ? "pointer-events-none" : ""}
          >
            <div
              className={`font-black text-sm uppercase tracking-widest truncate transition-colors ${
                isPlayable
                  ? "text-white group-hover:text-theme-300 group-hover:drop-shadow-[0_0_8px_rgba(var(--theme-500),0.5)]"
                  : "text-theme-500/20"
              }`}
            >
              {data.title}
            </div>
          </Link>
          <div className="flex items-center gap-x-2">
            <Link
              href={ROUTES.GENRE(data.genre ?? "")}
              className={!isPlayable ? "pointer-events-none" : ""}
            >
              <p
                className={`text-[10px] truncate uppercase tracking-widest transition-colors ${
                  isPlayable
                    ? "text-theme-500/60 hover:text-theme-300"
                    : "text-theme-500/10"
                }`}
              >
                // {data?.genre}
              </p>
            </Link>
            <span className="text-theme-500/20 text-[8px]">•</span>
            <p
              className={`text-[10px] truncate uppercase tracking-widest ${
                isPlayable ? "text-theme-500/40" : "text-theme-500/10"
              }`}
            >
              {data?.author}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-x-4 sm:gap-x-8 pr-2 ml-auto text-[10px] font-bold uppercase tracking-widest">
          <div
            className={`flex items-center gap-x-1.5 transition-colors ${
              isPlayable
                ? "text-theme-500/40 group-hover:text-theme-500"
                : "text-theme-500/10"
            }`}
          >
            <PlayIcon size={12} className="opacity-70" />
            <span className="tabular-nums">{data?.count}</span>
          </div>

          <div
            className={`flex items-center gap-x-1.5 transition-colors ${
              isPlayable
                ? "text-theme-500/40 group-hover:text-theme-500"
                : "text-theme-500/10"
            }`}
          >
            <Heart size={12} className="opacity-70" />
            <span className="tabular-nums">{data?.like_count}</span>
          </div>

          {/* ダウンロード状態インジケーター */}
          {isDownloaded && (
            <div className="flex items-center">
              <div className="text-theme-500 drop-shadow-[0_0_8px_rgba(var(--theme-500),0.5)]">
                <IoCloudDone size={16} />
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
