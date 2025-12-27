"use client";

import useGetSongById from "@/hooks/data/useGetSongById";
import usePlayer from "@/hooks/player/usePlayer";
import useGetPlaylists from "@/hooks/data/useGetPlaylists";
import React, { memo, useMemo } from "react";
import PlayerContent from "./PlayerContent";

const Player = () => {
  const player = usePlayer();
  // クライアントサイドでプレイリストを取得（オフライン対応付き）
  const { playlists } = useGetPlaylists();

  // 1. まずローカルストア（Zustand）から曲を取得（プレフィックス不問）
  const localSong = useMemo(() => {
    if (!player.activeId) return null;
    return player.getLocalSong(player.activeId);
  }, [player.activeId, player.getLocalSong]);

  // 2. ローカルストアになく、かつIDが local_ で始まらない場合のみ Supabase から取得
  const isActuallyLocalId = useMemo(() => {
    return (
      typeof player.activeId === "string" &&
      player.activeId.startsWith("local_")
    );
  }, [player.activeId]);

  const { song: onlineSong } = useGetSongById(
    localSong || isActuallyLocalId ? undefined : player.activeId
  );

  // 最終的な曲を決定
  const finalSong = localSong || onlineSong;

  if (!finalSong || !finalSong.song_path) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 w-full z-50 ">
      <div className="bg-[#121212] border-t border-[#303030] rounded-t-xl w-full h-[100px]">
        <PlayerContent song={finalSong} playlists={playlists} />
      </div>
    </div>
  );
};

// メモ化してパフォーマンスを改善
export default memo(Player);
