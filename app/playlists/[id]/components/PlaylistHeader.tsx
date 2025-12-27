"use client";

import React, { memo } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import PlaylistOptionsPopover from "@/components/Playlist/PlaylistOptionsPopover";
import { Globe, Lock } from "lucide-react";
import { useUser } from "@/hooks/auth/useUser";

interface PlaylistHeaderProps {
  playlistId: string;
  playlistTitle: string;
  imageUrl: string;
  songCount: number;
  isPublic: boolean;
  createdAt: string;
  userId: string;
}

const PlaylistHeader: React.FC<PlaylistHeaderProps> = memo(
  ({
    playlistId,
    playlistTitle,
    imageUrl,
    songCount,
    isPublic,
    createdAt,
    userId,
  }) => {
    const { user } = useUser();
    const formattedDate = format(new Date(createdAt), "yyyy年MM月dd日", {
      locale: ja,
    });

    return (
      <div className="relative w-full h-[250px] md:h-[400px]">
        {/* 背景画像 */}
        <div className="absolute inset-0 w-full h-full">
          <Image
            src={imageUrl}
            alt="Playlist background"
            fill
            className="object-cover"
            sizes="100vw"
          />
        </div>
        {/* グラデーションオーバーレイ */}
        <div className="absolute inset-0 bg-gradient-to-br from-theme-900/80 via-neutral-900/90 to-neutral-900/95" />
        {/* グラスモーフィズム効果 */}
        <div className="absolute inset-0 backdrop-blur-sm bg-black/20">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 50% 0%, rgba(255,255,255,0.2), transparent 70%)",
            }}
          />
        </div>
        {/* コンテンツ */}
        <div className="relative h-full max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6 flex items-end">
          <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-x-6 w-full">
            {/* プレイリストアートワーク */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="relative h-32 w-32 md:h-52 md:w-52 group mx-auto md:mx-0"
            >
              <div className="absolute -top-2 -left-2 w-full h-full bg-theme-900/50 transform rotate-3 rounded-xl hidden md:block" />
              <div className="absolute -top-1 -left-1 w-full h-full bg-theme-800/50 transform rotate-2 rounded-xl hidden md:block" />
              <Image
                src={imageUrl}
                alt="Playlist"
                fill
                className="object-cover rounded-xl shadow-2xl"
                sizes="(max-width: 640px) 128px, (max-width: 768px) 208px, 208px"
              />
            </motion.div>
            {/* プレイリスト情報 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col gap-y-2 text-center md:text-left"
            >
              <div className="flex items-center justify-center md:justify-start gap-x-4">
                <h1 className="text-3xl md:text-5xl font-bold text-white tracking-wide drop-shadow-lg break-all">
                  {playlistTitle}
                </h1>
                {user?.id === userId && ( // 条件付きレンダリングを追加
                  <PlaylistOptionsPopover
                    playlistId={playlistId}
                    currentTitle={playlistTitle}
                    isPublic={isPublic}
                  />
                )}
              </div>
              <div className="flex items-center gap-x-2 text-sm text-white/80">
                {isPublic ? (
                  <Globe className="w-4 h-4" />
                ) : (
                  <Lock className="w-4 h-4" />
                )}
                <span>{isPublic ? "公開" : "非公開"}</span>
                <span className="mx-2">•</span>
                <span>{songCount} 曲</span>
                <span className="mx-2">•</span>
                <span>作成日: {formattedDate}</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }
);

// displayName を設定
PlaylistHeader.displayName = "PlaylistHeader";

export default PlaylistHeader;
