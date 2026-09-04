"use client";

import { usePathname } from "next/navigation";
import useGetSongById from "@/hooks/data/useGetSongById";
import usePlayer from "@/hooks/player/usePlayer";
import useGetPlaylists from "@/hooks/data/useGetPlaylists";
import React, { memo, useMemo } from "react";
import PlayerContent from "./PlayerContent";
import LyricsModal from "../modals/LyricsModal/LyricsModal";

const Player = () => {
  const pathname = usePathname();
  const isPulsePage = pathname === "/pulse";
  const player = usePlayer();
  const { playlists } = useGetPlaylists();

  // 1. 縺ｾ縺壹Ο繝ｼ繧ｫ繝ｫ繧ｹ繝医い・・ustand・峨°繧画峇繧貞叙蠕暦ｼ医・繝ｬ繝輔ぅ繝・け繧ｹ荳榊撫・・
  const localSong = useMemo(() => {
    if (!player.activeId) return null;
    return player.getLocalSong(player.activeId);
  }, [player.activeId, player.getLocalSong]);

  // 2. 繝ｭ繝ｼ繧ｫ繝ｫ繧ｹ繝医い縺ｫ縺ｪ縺上√°縺､ID縺・local_ 縺ｧ蟋九∪繧峨↑縺・ｴ蜷医・縺ｿ Supabase 縺九ｉ蜿門ｾ・
  const isActuallyLocalId = useMemo(() => {
    return (
      typeof player.activeId === "string" &&
      player.activeId.startsWith("local_")
    );
  }, [player.activeId]);

  const { song: onlineSong } = useGetSongById(
    localSong || isActuallyLocalId ? undefined : player.activeId,
  );

  // 譛邨ら噪縺ｪ譖ｲ繧呈ｱｺ螳・
  const finalSong = localSong || onlineSong;

  // pulse繝壹・繧ｸ縺ｧ縺ｯ繝励Ξ繧､繝､繝ｼ繧帝撼陦ｨ遉ｺ
  if (isPulsePage) {
    return null;
  }

  if (!finalSong || !finalSong.song_path) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-0 left-0 w-full z-50">
        <div className="bg-[#0a0a0f] border-t-2 border-theme-500/40 w-full h-[100px] shadow-[0_-10px_30px_rgba(0,0,0,0.8),0_-5px_15px_rgba(var(--theme-500),0.1)] relative">
          {/* HUD陬・｣ｾ繝ｩ繧､繝ｳ */}
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-theme-500/40 to-transparent" />
          
          <PlayerContent song={finalSong} playlists={playlists} />
        </div>
      </div>

      {/* 蜈ｨ逕ｻ髱｢豁瑚ｩ槭Δ繝ｼ繝繝ｫ */}
      <LyricsModal song={finalSong} />
    </>
  );
};

export default memo(Player);

