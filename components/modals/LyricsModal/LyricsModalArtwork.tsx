"use client";

import React from "react";
import Image from "next/image";
import { Song } from "@/types";
import { getPlayableImagePath } from "@/libs/songUtils";

interface LyricsModalArtworkProps {
  song: Song;
}

const LyricsModalArtwork: React.FC<LyricsModalArtworkProps> = ({ song }) => {
  const imagePath = getPlayableImagePath(song);

  return (
    <div className="relative flex flex-col h-full w-full overflow-hidden">
      {/* 背景グラデーション */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-900/40 via-purple-800/30 to-pink-700/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

      {/* メインコンテンツ */}
      <div className="relative flex flex-col items-center justify-center flex-1 p-8">
        {/* アルバムアート */}
        <div className="relative w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 rounded-2xl overflow-hidden shadow-2xl shadow-black/50 ring-1 ring-white/10">
          {imagePath ? (
            <Image
              src={imagePath}
              alt={song.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 256px, (max-width: 1024px) 320px, 384px"
              priority
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center">
              <span className="text-neutral-500 text-6xl">♪</span>
            </div>
          )}
        </div>
      </div>

      {/* 曲情報（下部） */}
      <div className="relative px-8 pb-8">
        <div className="flex items-center gap-4">
          {/* アーティストアイコン */}
          <div className="relative w-12 h-12 rounded-full overflow-hidden bg-neutral-800 ring-2 ring-white/10 flex-shrink-0">
            {imagePath ? (
              <Image
                src={imagePath}
                alt={song.author}
                fill
                className="object-cover"
                sizes="48px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-500">
                ♪
              </div>
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <h2 className="text-xl md:text-2xl font-bold text-white truncate">
              {song.title}
            </h2>
            <p className="text-neutral-400 text-sm md:text-base truncate">
              {song.author}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LyricsModalArtwork;
