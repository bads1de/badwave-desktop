import React from "react";
import Image from "next/image";
import { Song } from "@/types";

interface NextSongPreviewProps {
  nextSong: Song | undefined;
  nextImagePath?: string;
}

const NextSongPreview: React.FC<NextSongPreviewProps> = React.memo(
  ({ nextSong, nextImagePath }) => {
    if (!nextSong) return null;

    return (
      <div className="absolute bottom-6 left-4 right-4 z-20 transition-all duration-500 transform translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100">
        <div className="bg-neutral-900/80 backdrop-blur-xl border border-white/10 p-3 rounded-2xl shadow-2xl hover:bg-neutral-900/90 transition-colors duration-300">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 shadow-lg">
              <Image
                src={nextImagePath || "/images/playlist.png"}
                alt="Next Song"
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width:1280px) 25vw, 20vw"
              />
            </div>
            <div className="flex-grow min-w-0 flex flex-col justify-center">
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5">
                Next Up
              </p>
              <h3 className="text-sm font-bold text-white truncate w-full">
                {nextSong.title}
              </h3>
              <p className="text-xs text-neutral-400 truncate w-full">
                {nextSong.author}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

NextSongPreview.displayName = "NextSongPreview";

export default NextSongPreview;
