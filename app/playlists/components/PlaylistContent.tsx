"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Playlist } from "@/types";
import { motion } from "framer-motion";
import { memo, useCallback } from "react";

interface PlaylistContentProps {
  playlists: Playlist[];
}

const PlaylistContent: React.FC<PlaylistContentProps> = memo(
  ({ playlists }) => {
    const router = useRouter();

    // ナビゲーションハンドラをメモ化
    const handlePlaylistClick = useCallback(
      (id: string) => {
        router.push(`/playlists/${id}`);
      },
      [router]
    );

    if (playlists.length === 0) {
      return (
        <div className="flex flex-col gap-y-2 w-full px-6 text-neutral-400">
          <h1>Playlistが見つかりませんでした</h1>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 p-6">
        {playlists.map((playlist, i) => (
          <motion.div
            key={playlist.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className="group relative cursor-pointer"
            onClick={() => handlePlaylistClick(playlist.id)}
          >
            {/* 背景の重なった効果 */}
            <div className="absolute -top-2 -left-2 w-full h-full bg-theme-900/50 transform rotate-3 rounded-xl" />
            <div className="absolute -top-1 -left-1 w-full h-full bg-theme-800/50 transform rotate-2 rounded-xl" />

            {/* メインカード */}
            <div className="relative bg-neutral-900 rounded-xl p-4 transform transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-xl group-hover:shadow-theme-900/20">
              {/* アートワーク */}
              <div className="relative aspect-square w-full overflow-hidden rounded-lg mb-4">
                <Image
                  src={playlist.image_path || "/images/playlist.png"}
                  alt={playlist.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width:1280px) 25vw, 20vw"
                />
                {/* オーバーレイグラデーション */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              {/* プレイリスト情報 */}
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white truncate">
                  {playlist.title}
                </h3>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  }
);

// displayName を設定
PlaylistContent.displayName = "PlaylistContent";

export default PlaylistContent;
