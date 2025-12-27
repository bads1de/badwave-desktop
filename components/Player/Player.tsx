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
