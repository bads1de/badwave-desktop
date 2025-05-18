import React from "react";
import { Song } from "@/types";
import NextSongPreview from "./NextSongPreview";
import CurrentSongDisplay from "./CurrentSongDisplay";
import useLyricsStore from "@/hooks/stores/useLyricsStore";

interface FullScreenLayoutProps {
  song: Song;
  videoPath?: string;
  imagePath?: string;
  nextSong: Song;
  nextImagePath?: string;
}

const FullScreenLayout: React.FC<FullScreenLayoutProps> = React.memo(
  ({ song, videoPath, imagePath, nextSong, nextImagePath }) => {
    const { showLyrics } = useLyricsStore();
    const lyrics = song.lyrics ?? "歌詞はありません";

    if (showLyrics) {
      return (
        <div className="relative w-full h-full bg-black custom-scrollbar">
          <div className="flex items-center justify-center h-full pb-6">
            <div className="w-full max-h-full overflow-auto">
              <p
                className="whitespace-pre-wrap text-white text-xl font-medium text-center"
                style={{ textShadow: "0 0 10px #fff" }}
              >
                {lyrics}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="relative w-full h-full overflow-hidden rounded-xl">
        <CurrentSongDisplay
          song={song}
          videoPath={videoPath}
          imagePath={imagePath}
        />
        <div className="absolute bottom-0 left-0 right-0 flex flex-col">
          <NextSongPreview nextSong={nextSong} nextImagePath={nextImagePath} />
        </div>
      </div>
    );
  }
);

FullScreenLayout.displayName = "FullScreenLayout";

export default FullScreenLayout;
