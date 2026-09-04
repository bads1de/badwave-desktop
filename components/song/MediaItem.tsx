"use client";

import Image from "next/image";
import { Song } from "@/types";
import usePlayer from "@/hooks/player/usePlayer";
import { twMerge } from "tailwind-merge";
import ScrollingText from "../common/ScrollingText";
import { memo, useCallback, useMemo } from "react";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";
import useDownloadSong from "@/hooks/utils/useDownloadSong";
import { IoCloudDone, IoCloudOffline } from "react-icons/io5";
import { getPlayableImagePath } from "@/libs/songUtils";

interface MediaItemProps {
  data: Song;
  onClick?: (id: string) => void;
  isCollapsed?: boolean;
  className?: string;
  /** 再生可能状態を外部から制御する場合に使用 */
  forcePlayable?: boolean;
}

const MediaItem: React.FC<MediaItemProps> = memo(
  ({ data, onClick, isCollapsed, className, forcePlayable }) => {
    const player = usePlayer();
    const { isOnline } = useNetworkStatus();

    // まずプロパティを確認、なければフックにフォールバック
    // is_downloaded が既に true なら、フックは IPC をスキップする
    const { isDownloaded: hookIsDownloaded } = useDownloadSong(data);
    const isDownloaded = data.is_downloaded ?? hookIsDownloaded;

    // オフラインかつダウンロードされていない場合は再生不可
    // forcePlayable が true の場合は常に再生可能
    const isPlayable = forcePlayable ?? (isOnline || isDownloaded);

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
      <div
        onClick={handleClick}
        className={twMerge(
          `
        flex
        items-center
        gap-x-4
        rounded-none
        p-2
        group
        relative
        animate-fade-in
        font-mono
        transition-all
        duration-300
        ${
          isPlayable
            ? "cursor-pointer hover:bg-theme-500/5"
            : "cursor-not-allowed opacity-40 grayscale"
        }
        `,
          className,
        )}
      >
        <div
          className={twMerge(
            `
          relative
          rounded-none
          h-12
          w-12
          min-h-[48px]
          min-w-[48px]
          transition-all
          duration-500
          border
          border-theme-500/20
          group-hover:border-theme-500/60
          group-hover:shadow-[0_0_15px_rgba(var(--theme-500),0.3)]
          overflow-hidden
          cyber-glitch
          `,
          )}
        >
          {imagePath && (
            <Image
              fill
              src={imagePath}
              alt="MediaItem"
              className={`object-cover transition-all duration-700 ${
                isPlayable ? "group-hover:scale-125 group-hover:opacity-70" : ""
              }`}
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width:1280px) 25vw, 20vw"
            />
          )}

          {/* シグナルオーバーレイ */}
          <div className="absolute inset-0 bg-theme-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

          {/* オフラインで再生不可のインジケーター */}
          {!isPlayable && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <IoCloudOffline size={16} className="text-theme-500/60" />
            </div>
          )}
        </div>
        {!isCollapsed && (
          <div className="flex flex-col gap-y-0.5 overflow-hidden w-[75%]">
            <div className="flex items-center gap-2">
              <div className="text-theme-300 font-bold text-sm truncate uppercase tracking-tighter group-hover:text-white transition-colors group-hover:drop-shadow-[0_0_5px_rgba(var(--theme-500),0.5)]">
                <ScrollingText text={data.title} limitCharacters={15} />
              </div>
              {/* ダウンロード済みインジケーター */}
              {isDownloaded && (
                <IoCloudDone
                  size={12}
                  className="text-theme-500 flex-shrink-0 drop-shadow-[0_0_5px_rgba(var(--theme-500),0.5)]"
                />
              )}
            </div>
            <p className="text-[10px] text-theme-500/60 truncate uppercase tracking-widest">
              // AUTH: {data.author}
            </p>
          </div>
        )}
      </div>
    );
  }
);

// 表示名を設定
MediaItem.displayName = "MediaItem";

export default MediaItem;
