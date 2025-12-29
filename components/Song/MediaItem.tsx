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
        gap-x-3
        rounded-xl
        p-2
        group
        relative
        animate-fade-in
        ${isPlayable ? "cursor-pointer" : "cursor-not-allowed opacity-60"}
        `,
          className
        )}
      >
        <div
          className={twMerge(
            `
          relative
          rounded-lg
          min-h-[48px]
          min-w-[48px]
          transition-transform
          duration-300
          shadow-md
          `
          )}
        >
          {imagePath && (
            <Image
              fill
              src={imagePath}
              alt="MediaItem"
              className={`object-cover rounded-xl transition-all duration-500 ${
                isPlayable ? "group-hover:scale-110" : "grayscale"
              }`}
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width:1280px) 25vw, 20vw"
            />
          )}

          {/* オフラインで再生不可のインジケーター */}
          {!isPlayable && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
              <IoCloudOffline size={20} className="text-gray-400" />
            </div>
          )}
        </div>
        {!isCollapsed && (
          <div className="flex flex-col gap-y-1 overflow-hidden w-[70%]">
            <div className="flex items-center gap-2">
              <ScrollingText text={data.title} limitCharacters={10} />
              {/* ダウンロード済みインジケーター */}
              {isDownloaded && (
                <IoCloudDone
                  size={14}
                  className="text-theme-500 flex-shrink-0"
                />
              )}
            </div>
            <p
              className={`text-sm truncate transition-colors ${
                isPlayable
                  ? "text-neutral-400 group-hover:text-neutral-300"
                  : "text-neutral-600"
              }`}
            >
              {data.author}
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
