import React from "react";
import { Song } from "@/types";
import NextSongPreview from "./NextSongPreview";
import CurrentSongDisplay from "./CurrentSongDisplay";
import useLyricsStore from "@/hooks/stores/useLyricsStore";

interface FullScreenLayoutProps {
  song: Song;
  videoPath?: string;
  imagePath?: string;
  nextSong: Song | undefined;
  nextImagePath?: string;
}

const FullScreenLayout: React.FC<FullScreenLayoutProps> = React.memo(
  ({ song, videoPath, imagePath, nextSong, nextImagePath }) => {
    const { showLyrics } = useLyricsStore();
    const lyrics = song.lyrics ?? "歌詞はありません";

    if (showLyrics) {
      return (
        <div className="relative w-full h-full bg-black/20 backdrop-blur-sm custom-scrollbar rounded-xl border border-white/5">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/40 pointer-events-none" />
          <div className="flex items-center justify-center h-full py-8 px-6">
            <div className="w-full max-h-full overflow-y-auto custom-scrollbar pr-2">
              <p
                className="whitespace-pre-wrap text-neutral-200 text-lg font-medium leading-relaxed tracking-wide text-center"
                style={{ textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}
              >
                {lyrics}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="relative w-full h-full overflow-hidden rounded-xl shadow-2xl ring-1 ring-white/5 bg-neutral-900 group">
        <CurrentSongDisplay
          song={song}
          videoPath={videoPath}
          imagePath={imagePath}
        />
        <NextSongPreview nextSong={nextSong} nextImagePath={nextImagePath} />
      </div>
    );
  }
);

FullScreenLayout.displayName = "FullScreenLayout";

export default FullScreenLayout;
