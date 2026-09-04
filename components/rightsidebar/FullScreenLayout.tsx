import React from "react";
import { Song } from "@/types";
import NextSongPreview from "./NextSongPreview";
import CurrentSongDisplay from "./CurrentSongDisplay";
import useLyricsStore from "@/hooks/stores/useLyricsStore";
import SyncedLyrics from "@/components/lyrics/SyncedLyrics";

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
    const lyrics = song.lyrics ?? "";

    if (showLyrics) {
      return (
        <div className="relative w-full h-full bg-[#0a0a0f] rounded-none border border-theme-500/10 group overflow-hidden">
          {/* HUDコーナー装飾 */}
          <div className="absolute top-0 right-0 w-6 h-6 border-t border-r border-theme-500/30 z-30 group-hover:border-theme-500/60 transition-colors pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b border-l border-theme-500/30 z-30 group-hover:border-theme-500/60 transition-colors pointer-events-none" />
          {/* アクティブラインガイド用の疑似オーバーレイ */}
          <div className="absolute top-[37px] left-3 bottom-12 w-px bg-theme-500/[0.03] pointer-events-none z-0" />
          <SyncedLyrics lyrics={lyrics} />
        </div>
      );
    }

    return (
      <div className="relative w-full h-full overflow-hidden rounded-none shadow-2xl border border-theme-500/20 bg-[#0a0a0f] group">
        {/* HUD繧ｳ繝ｼ繝翫・ */}
        <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-theme-500/40 z-20 group-hover:border-theme-500 transition-colors pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-theme-500/40 z-20 group-hover:border-theme-500 transition-colors pointer-events-none" />

        <CurrentSongDisplay
          song={song}
          videoPath={videoPath}
          imagePath={imagePath}
        />
        <NextSongPreview nextSong={nextSong} nextImagePath={nextImagePath} />
      </div>
    );
  },
);

FullScreenLayout.displayName = "FullScreenLayout";

export default FullScreenLayout;

