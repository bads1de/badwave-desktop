import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CiPlay1 } from "react-icons/ci";
import { AiOutlineHeart } from "react-icons/ai";
import { Song } from "@/types";
import { splitTags } from "@/libs/utils";
import ScrollingText from "../common/ScrollingText";
import DownloadIndicator from "../common/DownloadIndicator";
import CyberArtFallback from "../common/CyberArtFallback";
import { ROUTES } from "@/constants";

interface CurrentSongDisplayProps {
  song: Song;
  videoPath?: string;
  imagePath?: string;
}

const MAX_VISIBLE_TAGS = 3;

const CurrentSongDisplay: React.FC<CurrentSongDisplayProps> = React.memo(
  ({ song, videoPath, imagePath }) => {
    const [showAllGenres, setShowAllGenres] = useState(false);
    const tags = splitTags(song.genre);

    const uniqueTags = Array.from(new Set(tags));
    const visibleGenres = showAllGenres
      ? uniqueTags
      : uniqueTags.slice(0, MAX_VISIBLE_TAGS);
    const hasMoreGenres = tags.length > MAX_VISIBLE_TAGS;
    const onlineImagePath =
      imagePath && (imagePath.startsWith("http") || imagePath.startsWith("/"));

    return (
      <div className="relative w-full h-full group font-mono">
        {song.video_path ? (
          <video
            src={videoPath!}
            autoPlay
            loop
            muted
            className="z-0 h-full w-full object-cover transition-all duration-1000 group-hover:scale-110 opacity-60 group-hover:opacity-40"
          />
        ) : onlineImagePath ? (
          <Image
            src={imagePath}
            alt="Song Image"
            fill
            className="z-0 object-cover transition-all duration-1000 group-hover:scale-110 opacity-60 group-hover:opacity-40"
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width:1280px) 25vw, 20vw"
          />
        ) : (
          <CyberArtFallback />
        )}

        {/* 背景装飾 */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f]/40 via-transparent to-[#0a0a0f]" />
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[length:100%_4px] bg-[linear-gradient(rgba(255,255,255,0)_50%,rgba(0,0,0,0.5)_50%)]" />

        {/* Current Song Info (HUD Style) */}
        <div className="absolute bottom-28 left-0 right-0 px-6 flex flex-col justify-end space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[8px] text-theme-500 tracking-[0.5em] uppercase animate-pulse">
              <span className="w-1.5 h-1.5 bg-theme-500 rounded-full" />[
              LIVE_STREAM_DATA ]
            </div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter drop-shadow-[0_0_10px_rgba(var(--theme-500),0.8)] cyber-glitch">
              <Link href={ROUTES.SONGS_DETAIL(song.id)}>
                <ScrollingText text={song.title} />
              </Link>
            </h1>
            <p className="text-theme-400 text-lg uppercase tracking-widest border-l-2 border-theme-500 pl-3">
              // AUTH: {song.author}
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {visibleGenres.map((genre, index) => (
                <Link
                  key={index}
                  href={ROUTES.GENRE(genre)}
                  className="bg-theme-500/5 border border-theme-500/20 px-3 py-1 text-[10px] text-theme-400 font-bold uppercase tracking-widest hover:bg-theme-500/20 hover:border-theme-500/40 transition-all shadow-[inset_0_0_5px_rgba(var(--theme-500),0.1)]"
                >
                  # {genre}
                </Link>
              ))}
              {hasMoreGenres && !showAllGenres && (
                <button
                  onClick={() => setShowAllGenres(true)}
                  className="bg-theme-500/5 border border-theme-500/20 px-2 py-1 text-[10px] text-theme-500 font-bold uppercase hover:bg-theme-500/20 transition-all font-mono"
                >
                  +{tags.length - MAX_VISIBLE_TAGS}
                </button>
              )}
            </div>

            <div className="flex items-center gap-6 py-3 border-y border-theme-500/10 text-[10px] font-bold text-theme-500/60 tracking-widest uppercase">
              <div className="flex items-center gap-2">
                <CiPlay1 size={14} className="text-theme-500" />
                <span>LOG: {song.count}</span>
              </div>
              <div className="flex items-center gap-2">
                <AiOutlineHeart size={14} className="text-theme-500" />
                <span>AFF: {song.like_count}</span>
              </div>
              <div className="ml-auto">
                <DownloadIndicator song={song} size={20} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

CurrentSongDisplay.displayName = "CurrentSongDisplay";

export default CurrentSongDisplay;
