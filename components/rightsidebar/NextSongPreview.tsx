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

    const onlineImagePath =
      nextImagePath &&
      (nextImagePath.startsWith("http") || nextImagePath.startsWith("/"));

    return (
      <div className="absolute bottom-6 left-4 right-4 z-20 transition-all duration-700 transform translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 font-mono">
        <div className="bg-[#0a0a0f]/90 backdrop-blur-xl border border-theme-500/40 p-4 rounded-none shadow-[0_0_30px_rgba(0,0,0,0.8),0_0_15px_rgba(var(--theme-500),0.1)] hover:bg-[#0a0a0f] transition-all duration-300 relative group/next cyber-glitch">
          {/* HUD装飾 */}
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-theme-500" />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-theme-500" />

          <div className="flex items-center gap-4">
            <div className="relative w-12 h-12 rounded-none overflow-hidden shrink-0 border border-theme-500/30 group-hover/next:border-theme-500 transition-colors shadow-[0_0_10px_rgba(var(--theme-500),0.2)]">
              <Image
                src={onlineImagePath ? nextImagePath : "/images/playlist.png"}
                alt="Next Song"
                fill
                className="object-cover transition-all duration-700 group-hover/next:scale-125 opacity-80"
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width:1280px) 25vw, 20vw"
              />
            </div>
            <div className="flex-grow min-w-0 flex flex-col justify-center">
              <p className="text-[8px] font-black text-theme-500 uppercase tracking-[0.3em] mb-1 animate-pulse">
                [ NEXT_NODE_QUEUE ]
              </p>
              <h3 className="text-xs font-bold text-white truncate w-full uppercase tracking-widest drop-shadow-[0_0_5px_rgba(var(--theme-500),0.5)]">
                {nextSong.title}
              </h3>
              <p className="text-[10px] text-theme-500/60 truncate w-full uppercase mt-0.5">
                // AUTH: {nextSong.author}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

NextSongPreview.displayName = "NextSongPreview";

export default NextSongPreview;
