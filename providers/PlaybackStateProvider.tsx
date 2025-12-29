"use client";

import { useEffect, useRef } from "react";
import usePlayer from "@/hooks/player/usePlayer";
import usePlaybackStateStore from "@/hooks/stores/usePlaybackStateStore";

/**
 * 保存された再生状態を復元するプロバイダー
 * アプリ起動時に前回の再生位置から曲を再開できるようにする
 */
const PlaybackStateProvider = ({ children }: { children: React.ReactNode }) => {
  const player = usePlayer();
  const {
    songId: savedSongId,
    playlist: savedPlaylist,
    hasHydrated,
    setIsRestoring,
  } = usePlaybackStateStore();
  const hasRestoredRef = useRef(false);

  useEffect(() => {
    // ハイドレーション完了まで待つ
    if (!hasHydrated) return;

    // 既に復元済みなら何もしない
    if (hasRestoredRef.current) return;

    // 保存された曲IDがあれば復元
    if (savedSongId) {
      // 復元中フラグを設定（自動再生を防止）
      setIsRestoring(true);

      // プレイリストを復元
      if (savedPlaylist.length > 0) {
        player.setIds(savedPlaylist);
      }

      // 曲IDを設定（これによりプレイヤーが表示される）
      player.setId(savedSongId);

      hasRestoredRef.current = true;
    }
  }, [hasHydrated, savedSongId, savedPlaylist, player, setIsRestoring]);

  return <>{children}</>;
};

export default PlaybackStateProvider;
