"use client";

import Image from "next/image";
import { Song } from "@/types";
import usePlayer from "@/hooks/player/usePlayer";
import { twMerge } from "tailwind-merge";
import ScrollingText from "../common/ScrollingText";
import { memo, useCallback } from "react";

interface MediaItemProps {
  data: Song;
  onClick?: (id: string) => void;
  isCollapsed?: boolean;
  className?: string;
}

const MediaItem: React.FC<MediaItemProps> = memo(
  ({ data, onClick, isCollapsed, className }) => {
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
      <div
        onClick={handleClick}
        className={twMerge(
          `
        flex
        items-center
        gap-x-3
        cursor-pointer
        rounded-xl
        p-2
        group
        relative
        animate-fade-in
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
          {data.image_path && (
            <Image
              fill
              src={data.image_path!}
              alt="MediaItem"
              className="object-cover rounded-xl transition-all duration-500 group-hover:scale-110"
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width:1280px) 25vw, 20vw"
            />
          )}
        </div>
        {!isCollapsed && (
          <div className="flex flex-col gap-y-1 overflow-hidden w-[70%]">
            <ScrollingText text={data.title} limitCharacters={10} />
            <p className="text-neutral-400 text-sm truncate group-hover:text-neutral-300 transition-colors">
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
