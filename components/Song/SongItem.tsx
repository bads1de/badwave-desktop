"use client";

import { Song } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { CiHeart, CiPlay1 } from "react-icons/ci";
import ScrollingText from "../common/ScrollingText";
import { memo, useCallback } from "react";
import useDownloadSong from "@/hooks/utils/useDownloadSong";
import { IoCloudDone } from "react-icons/io5";

interface SongItemProps {
  onClick: (id: string) => void;
  data: Song;
}

const SongItem: React.FC<SongItemProps> = memo(({ onClick, data }) => {
  // クリックハンドラーをメモ化
  const handleClick = useCallback(() => {
    onClick(data.id);
  }, [onClick, data.id]);
  return (
    <div
      className="
        relative
        group
        flex
        flex-col
        items-center
        justify-center
        rounded-xl
        overflow-hidden
        bg-gradient-to-b
        from-gray-900/10
        to-gray-900/20
        cursor-pointer
        hover:from-gray-800/20
        hover:to-gray-800/30
        transition-all
        duration-300
        aspect-[9/16]
      "
    >
      <div className="relative w-full h-full">
        {data.image_path && (
          <Image
            className="object-cover w-full h-full transition-all duration-500 group-hover:scale-110"
            src={data.image_path}
            fill
            alt="Image"
            onClick={handleClick}
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width:1280px) 25vw, 20vw"
          />
        )}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
          <Link href={`/songs/${data.id}`} className="w-full block">
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="font-medium text-gray-100 truncate text-sm hover:text-gray-300 transition-colors group-hover:text-white group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
              <ScrollingText text={data.title} />
            </div>
          </Link>

          <p className="text-gray-400 text-xs mt-1 truncate hover:text-gray-300 transition-colors group-hover:text-white group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
            {data.author}
          </p>

          <div className="flex items-center justify-start mt-2 space-x-4">
            <div className="flex items-center text-gray-400 hover:text-gray-300 transition-colors group-hover:text-white group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
              <CiPlay1 size={14} />
              <span className="ml-1 text-xs">{data.count}</span>
            </div>
            <div className="flex items-center text-gray-400 hover:text-gray-300 transition-colors group-hover:text-white group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
              <CiHeart size={14} />
              <span className="ml-1 text-xs">{data.like_count}</span>
            </div>
            {/* ダウンロード状態を表示 */}
            <DownloadIndicator song={data} />
          </div>
        </div>
      </div>
    </div>
  );
});

const DownloadIndicator = ({ song }: { song: Song }) => {
  const { isDownloaded } = useDownloadSong(song);

  if (!isDownloaded) return null;

  return (
    <div className="flex items-center text-theme-500 drop-shadow-[0_0_8px_rgba(var(--theme-500),0.6)]">
      <IoCloudDone size={14} />
    </div>
  );
};

// 表示名を設定
SongItem.displayName = "SongItem";

export default SongItem;
