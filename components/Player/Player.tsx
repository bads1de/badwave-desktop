"use client";

import { usePathname } from "next/navigation";
import useGetSongById from "@/hooks/data/useGetSongById";
import usePlayer from "@/hooks/player/usePlayer";
import useGetPlaylists from "@/hooks/data/useGetPlaylists";
import React, { memo, useMemo, useRef } from "react";
import PlayerContent from "./PlayerContent";

const Player = () => {
  const pathname = usePathname();
  const isPulsePage = pathname === "/pulse";
  const player = usePlayer();
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
  const fetchedSong = localSong || onlineSong;

  // リマウント対策: 前回の有効な曲を保持（一時的にundefinedになっても再生を継続）
  const lastValidSongRef = useRef(fetchedSong);
  if (fetchedSong && fetchedSong.song_path) {
    lastValidSongRef.current = fetchedSong;
  }

  // 表示に使う曲（現在の曲、または前回の有効な曲）
  const displaySong = fetchedSong || lastValidSongRef.current;

  // pulseページではプレイヤーを完全に非表示
  if (isPulsePage) {
    return null;
  }

  // 曲が一度も再生されていない場合は何も表示しない
  if (!displaySong) {
    return null;
  }

  // 本来非表示にすべき状態かどうか
  const isHidden = !fetchedSong || !fetchedSong.song_path;

  return (
    <div
      className={`fixed bottom-0 left-0 w-full z-50 ${
        isHidden ? "invisible pointer-events-none" : ""
      }`}
    >
      <div className="bg-[#121212] border-t border-[#303030] rounded-t-xl w-full h-[100px]">
        {/* displaySongを使うことで、一時的にfetchedSongがundefinedでもPlayerContentがアンマウントされない */}
        <PlayerContent song={displaySong} playlists={playlists} />
      </div>
    </div>
  );
};

export default memo(Player);
