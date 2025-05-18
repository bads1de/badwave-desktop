"use client";

import React from "react";
import usePlayer from "@/hooks/player/usePlayer";
import useGetSongById from "@/hooks/data/useGetSongById";
import FullScreenLayout from "./FullScreenLayout";
import { twMerge } from "tailwind-merge";

interface RightSidebarProps {
  children: React.ReactNode;
}

const RightSidebar: React.FC<RightSidebarProps> = ({ children }) => {
  const player = usePlayer();
  const { song } = useGetSongById(player.activeId);
  const { song: nextSong } = useGetSongById(player.getNextSongId());

  const currentSong = song;
  const nextTrack = nextSong;

  const showRightSidebar = currentSong && nextTrack;

  return (
    <div className={twMerge(`flex h-full`, player.activeId && "h-full")}>
      <main className="h-full flex-1 overflow-y-auto ">{children}</main>
      {showRightSidebar && (
        <div className="hidden xl:flex w-96 h-full bg-black p-2">
          <FullScreenLayout
            song={currentSong!}
            videoPath={song?.video_path}
            imagePath={song?.image_path}
            nextSong={nextTrack}
            nextImagePath={nextTrack?.image_path}
          />
        </div>
      )}
    </div>
  );
};

export default RightSidebar;
