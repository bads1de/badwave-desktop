"use client";

import { Playlist } from "@/types";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import ScrollableContainer from "@/components/common/ScrollableContainer";
import { useState } from "react";

interface PublicPlaylistBoardProps {
  playlists: Playlist[];
}

const PublicPlaylistBoard: React.FC<PublicPlaylistBoardProps> = ({
  playlists,
}) => {
  const router = useRouter();
  const [showArrows, setShowArrows] = useState(false);

  return (
    <section className="mb-4">
      {/* プレイリストスクロールエリア */}
      <div
        onMouseEnter={() => setShowArrows(true)}
        onMouseLeave={() => setShowArrows(false)}
      >
        <ScrollableContainer showArrows={showArrows}>
          {playlists.map((playlist, i) => (
            <motion.div
              key={playlist.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: i * 0.1 }}
              className="group relative cursor-pointer min-w-[200px] max-w-[200px]"
              onClick={() =>
                router.push(
                  `/playlists/${playlist.id}?title=${encodeURIComponent(
                    playlist.title
                  )}`
                )
              }
            >
              {/* メインカード */}
              <div className="relative overflow-hidden bg-neutral-900/40 backdrop-blur-sm rounded-xl transition-all duration-300 border border-white/5 group-hover:border-theme-500/30 group-hover:bg-neutral-800/40">
                {/* アートワーク */}
                <div className="relative aspect-square w-full overflow-hidden">
                  <Image
                    src={playlist.image_path || "/images/playlist.png"}
                    alt={playlist.title}
                    fill
                    className="object-cover transition-all duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 200px"
                  />
                  {/* オーバーレイグラデーション */}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/80 opacity-0 group-hover:opacity-100 transition-all duration-300" />

                  {/* ホバー時のグロー効果 */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute inset-0 bg-theme-500/10 blur-xl" />
                  </div>
                </div>

                {/* プレイリスト情報 */}
                <div className="absolute bottom-0 w-full p-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-white truncate drop-shadow-lg">
                      {playlist.title}
                    </h3>
                    <p className="text-xs text-neutral-300 truncate opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {playlist.user_name || "Anonymous"}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </ScrollableContainer>
      </div>
    </section>
  );
};

export default PublicPlaylistBoard;
