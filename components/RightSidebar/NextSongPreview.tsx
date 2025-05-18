import React from "react";
import Image from "next/image";
import { Song } from "@/types";

interface NextSongPreviewProps {
  nextSong: Song;
  nextImagePath?: string;
}

const NextSongPreview: React.FC<NextSongPreviewProps> = React.memo(
  ({ nextSong, nextImagePath }) => {
    return (
      <div className="absolute bottom-0 left-0 right-0  p-6 bg-gradient-to-t from-black via-black/80 to-transparent">
        {nextSong && (
          <div className="flex items-center">
            <div className="relative w-16 h-16 rounded-full overflow-hidden shrink-0 mr-4">
              <Image
                src={nextImagePath || "/images/playlist.png"}
                alt="Next Song"
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width:1280px) 25vw, 20vw"
              />
            </div>
            <div className="flex-grow">
              <h3 className="text-lg font-semibold text-white line-clamp-1">
                {nextSong.title}
              </h3>
              <p className="text-sm text-gray-300 line-clamp-1">
                {nextSong.author}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }
);

NextSongPreview.displayName = "NextSongPreview";

export default NextSongPreview;
