"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import useGetAllSongsPaginated from "@/hooks/data/useGetAllSongsPaginated";
import { useSyncAllSongs } from "@/hooks/sync/useSyncAllSongs";
import useOnPlay from "@/hooks/player/useOnPlay";
import usePlayer from "@/hooks/player/usePlayer";

import SongItem from "@/components/Song/SongItem";
import Pagination from "@/components/common/Pagination";

const PAGE_SIZE = 24;

/**
 * 全曲一覧ページ
 *
 * Latest Releases の「全てを表示」から遷移する詳細ページ
 * ページネーション対応で全曲を閲覧可能
 */
export default function AllSongsPage() {
  const [page, setPage] = useState(0);

  // データ取得（ローカルDBから）
  const { songs, totalPages, isLoading } = useGetAllSongsPaginated(
    page,
    PAGE_SIZE
  );

  // バックグラウンド同期
  useSyncAllSongs();

  // 再生機能
  const player = usePlayer();
  const onPlay = useOnPlay(songs);

  const handlePlay = (id: string) => {
    onPlay(id);
    player.setId(id);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    // ページ変更時にトップにスクロール
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <div className="flex bg-[#0d0d0d] h-full overflow-hidden">
      <div className="w-full h-full overflow-y-auto custom-scrollbar">
        <main className="px-6 py-8 pb-32">
          {/* ヘッダー */}
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors mb-4"
            >
              <ArrowLeft size={20} />
              <span>ホームに戻る</span>
            </Link>
            <h1 className="text-4xl font-bold text-white tracking-tight">
              Latest Releases
            </h1>
            <p className="text-neutral-400 mt-2">
              全ての最新リリース楽曲を閲覧できます
            </p>
          </div>

          {/* 曲一覧 */}
          {isLoading && songs.length === 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square bg-neutral-800 rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : songs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <p className="text-neutral-400 text-lg">
                曲が見つかりませんでした
              </p>
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
            >
              {songs.map((song) => (
                <motion.div
                  key={song.id}
                  variants={itemVariants}
                  className="group relative transform transition duration-300 ease-in-out hover:scale-105"
                >
                  <SongItem onClick={handlePlay} data={song} />
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* ページネーション */}
          {totalPages > 1 && (
            <div className="mt-12">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
