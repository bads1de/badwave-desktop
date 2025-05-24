"use client";

import useGetSongById from "@/hooks/data/useGetSongById";
import usePlayer from "@/hooks/player/usePlayer";
import React, { memo, useMemo } from "react";
import PlayerContent from "./PlayerContent";
import MobileTabs from "../Mobile/MobileTabs";
import { Playlist, Song } from "@/types";
import useMobilePlayer from "@/hooks/player/useMobilePlayer";
import { isLocalSong } from "@/libs/songUtils";

interface PlayerProps {
  playlists: Playlist[];
}

const Player = ({ playlists }: PlayerProps) => {
  const player = usePlayer();
  const { isMobilePlayer, toggleMobilePlayer } = useMobilePlayer();

  // ローカル曲かどうかを判定
  const isLocalSongId = useMemo(() => {
    return (
      (typeof player.activeId === "string" &&
        player.activeId.startsWith("local_")) ||
      false
    );
  }, [player.activeId]);

  // ローカル曲の場合はローカルストアから、オンライン曲の場合はSupabaseから取得
  const localSong = useMemo(() => {
    if (!player.activeId || !isLocalSongId) return null;
    return player.getLocalSong(player.activeId);
  }, [player.activeId, isLocalSongId, player.getLocalSong]);

  // オンライン曲の場合のみ useGetSongById を使用
  const { song: onlineSong } = useGetSongById(
    isLocalSongId ? undefined : player.activeId
  );

  // 最終的な曲を決定
  const finalSong = localSong || onlineSong;

  if (!finalSong || (!finalSong.song_path && !isMobilePlayer)) {
    return (
      <>
        <div className="md:hidden ">
          <MobileTabs />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="fixed bottom-0 left-0 w-full ">
        <div className="bg-[#121212] border-t border-[#303030] rounded-t-xl w-full h-[100px] pb-[130px] md:pb-0 max-md:px-2">
          <PlayerContent
            song={finalSong}
            isMobilePlayer={isMobilePlayer}
            toggleMobilePlayer={toggleMobilePlayer}
            playlists={playlists}
          />
        </div>
      </div>
      {!isMobilePlayer && (
        <div className="md:hidden">
          <MobileTabs />
        </div>
      )}
    </>
  );
};

// メモ化してパフォーマンスを改善
export default memo(Player);
