import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CiPlay1 } from "react-icons/ci";
import { AiOutlineHeart } from "react-icons/ai";
import { BiChevronRight } from "react-icons/bi";
import { Song } from "@/types";
import { splitTags } from "@/libs/utils";
import ScrollingText from "../common/ScrollingText";
import useDownloadSong from "@/hooks/utils/useDownloadSong";
import { IoCloudDone } from "react-icons/io5";

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

    return (
      <div className="relative w-full h-full group">
        {song.video_path ? (
          <video
            src={videoPath!}
            autoPlay
            loop
            muted
            className="z-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <Image
            src={imagePath || "/images/loading.jpg"}
            alt="Song Image"
            fill
            className="z-0 object-cover transition-transform duration-700 group-hover:scale-105"
            unoptimized
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width:1280px) 25vw, 20vw"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/90 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-60 pointer-events-none" />

        {/* Current Song Info */}
        <div className="absolute bottom-28 left-0 right-0 px-8 pb-4 flex flex-col justify-end">
          <div className="mb-6">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-white mb-2 drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
              <Link
                className="cursor-pointer hover:text-theme-400 transition-colors"
                href={`/songs/${song.id}`}
              >
                <ScrollingText text={song.title} />
              </Link>
            </h1>
            <p className="text-neutral-200 text-xl font-bold drop-shadow-lg flex items-center gap-2 tracking-tight">
              <span className="opacity-60 text-sm uppercase tracking-widest font-black">
                by
              </span>
              <span className="text-white hover:text-theme-300 transition-colors cursor-pointer">
                {song.author}
              </span>
            </p>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-2.5">
              {visibleGenres.map((genre, index) => (
                <Link
                  key={index}
                  href={`/genre/${genre}`}
                  className="bg-white/10 backdrop-blur-xl border border-white/10 px-4 py-1.5 rounded-full text-xs font-bold text-neutral-200 hover:bg-theme-500 hover:text-white hover:border-theme-400 transition-all shadow-xl tracking-wide uppercase"
                >
                  {genre}
                </Link>
              ))}
              {hasMoreGenres && !showAllGenres && (
                <button
                  onClick={() => setShowAllGenres(true)}
                  className="flex items-center justify-center bg-white/5 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full hover:bg-white/20 text-neutral-300 transition-all font-bold"
                >
                  <span className="text-[10px]">
                    +{tags.length - MAX_VISIBLE_TAGS}
                  </span>
                  <BiChevronRight className="ml-0.5" size={14} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-8 pt-6 border-t border-white/5">
              <div className="flex items-center gap-2.5 group/metric">
                <div className="bg-white/5 p-2 rounded-xl border border-white/5 group-hover/metric:border-theme-500/50 transition-colors">
                  <CiPlay1
                    size={22}
                    className="text-white group-hover/metric:text-theme-400 transition-colors"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-neutral-500 font-black uppercase tracking-widest leading-none mb-1">
                    Plays
                  </span>
                  <span className="text-base font-black tabular-nums text-white leading-none">
                    {song.count}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 group/metric">
                <div className="bg-white/5 p-2 rounded-xl border border-white/5 group-hover/metric:border-theme-500/50 transition-colors">
                  <AiOutlineHeart
                    size={22}
                    className="text-white group-hover/metric:text-theme-400 transition-colors"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-neutral-500 font-black uppercase tracking-widest leading-none mb-1">
                    Likes
                  </span>
                  <span className="text-base font-black tabular-nums text-white leading-none">
                    {song.like_count}
                  </span>
                </div>
              </div>

              <div className="ml-auto">
                <DownloadIndicator song={song} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

const DownloadIndicator = ({ song }: { song: Song }) => {
  const { isDownloaded } = useDownloadSong(song);

  if (!isDownloaded) return null;

  return (
    <div className="flex items-center text-theme-500 drop-shadow-[0_0_8px_rgba(var(--theme-500),0.6)]">
      <IoCloudDone size={20} />
    </div>
  );
};

CurrentSongDisplay.displayName = "CurrentSongDisplay";

export default CurrentSongDisplay;
