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
        <div className="absolute bottom-28 left-0 right-0 px-6 pb-2 flex flex-col justify-end">
          <div className="mb-4">
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1 drop-shadow-md">
              <Link
                className="cursor-pointer hover:underline decoration-2 underline-offset-4 decoration-white/50"
                href={`/songs/${song.id}`}
              >
                <ScrollingText text={song.title} />
              </Link>
            </h1>
            <p className="text-neutral-300 text-lg font-medium drop-shadow-sm flex items-center gap-2">
              <span className="opacity-80">by</span>
              <span className="text-white">{song.author}</span>
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {visibleGenres.map((genre, index) => (
                <Link
                  key={index}
                  href={`/genre/${genre}`}
                  className="bg-white/10 backdrop-blur-sm border border-white/5 px-3 py-1 rounded-full text-neutral-200 hover:bg-white/20 hover:text-white transition-all shadow-sm"
                >
                  {genre}
                </Link>
              ))}
              {hasMoreGenres && !showAllGenres && (
                <button
                  onClick={() => setShowAllGenres(true)}
                  className="flex items-center justify-center bg-white/10 backdrop-blur-sm border border-white/5 px-2 py-1 h-[28px] rounded-full hover:bg-white/20 text-neutral-200 transition-all"
                >
                  <span className="text-xs">
                    +{tags.length - MAX_VISIBLE_TAGS}
                  </span>
                  <BiChevronRight className="ml-0.5" size={16} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-5 pt-2 border-t border-white/10">
              <div className="flex items-center gap-2 text-neutral-300">
                <CiPlay1 size={20} className="text-white" />
                <span className="text-sm font-medium">{song.count}</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-300">
                <AiOutlineHeart size={20} className="text-white" />
                <span className="text-sm font-medium">{song.like_count}</span>
              </div>
              <DownloadIndicator song={song} />
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
