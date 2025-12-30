import { useState, useCallback, useRef, useEffect } from "react";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";
import { createClient } from "@/libs/supabase/client";
import { electronAPI } from "@/libs/electron/index";
import { Song } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import { CACHED_QUERIES } from "@/constants";

/**
 * 特定のプレイリスト内の曲をバックグラウンドで同期する Syncer フック
 *
 * このフックは、オンライン時に Supabase から最新のプレイリスト曲を取得し、
 * ローカル DB に同期（Upsert）します。同期完了後、React Query のキャッシュを
 * 無効化して UI を更新します。
 *
 * @param playlistId - 同期対象のプレイリストID
 * @param options.autoSync - true の場合、マウント時およびオンライン復帰時に自動同期
 * @returns sync - 手動で同期をトリガーする関数
 * @returns isSyncing - 現在同期中かどうか
 */
export const useSyncPlaylistSongs = (
  playlistId?: string,
  options?: { autoSync?: boolean }
) => {
  const { autoSync = true } = options ?? {};
  const { isOnline } = useNetworkStatus();
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);
  const syncInProgress = useRef(false);
  const hasInitialSynced = useRef(false);

  // isOnline の最新値を常に保持する ref
  const isOnlineRef = useRef(isOnline);
  useEffect(() => {
    isOnlineRef.current = isOnline;
  }, [isOnline]);

  const sync = useCallback(async () => {
    // 同期条件のチェック
    if (!isOnlineRef.current || !playlistId || !electronAPI.isElectron()) {
      return { success: false, reason: "conditions_not_met" };
    }

    // 既に同期中の場合はスキップ
    if (syncInProgress.current) {
      return { success: false, reason: "already_syncing" };
    }

    syncInProgress.current = true;
    setIsSyncing(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("playlist_songs")
        .select("*, songs(*)")
        .eq("playlist_id", playlistId)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        const songs = data.map((item: any) => ({
          ...item.songs,
          songType: "regular",
        })) as Song[];

        await electronAPI.cache.syncPlaylistSongs({
          playlistId: String(playlistId),
          songs,
        });
        console.log(
          `[useSyncPlaylistSongs] Synced ${songs.length} songs for playlist ${playlistId}`
        );

        // キャッシュを無効化してUIを更新
        await queryClient.invalidateQueries({
          queryKey: [CACHED_QUERIES.playlists, playlistId, "songs"],
        });

        return { success: true, count: songs.length };
      }

      return { success: true, count: 0 };
    } catch (error) {
      console.error("[useSyncPlaylistSongs] Sync failed:", error);
      return { success: false, reason: "error", error };
    } finally {
      syncInProgress.current = false;
      setIsSyncing(false);
    }
  }, [playlistId, queryClient]);

  // 自動同期: マウント時およびオンライン復帰時
  useEffect(() => {
    if (!autoSync || !playlistId) return;

    // 初回同期
    if (isOnline && !hasInitialSynced.current) {
      hasInitialSynced.current = true;
      sync();
    }
  }, [autoSync, isOnline, playlistId, sync]);

  // プレイリストIDが変わった場合はリセット
  useEffect(() => {
    hasInitialSynced.current = false;
  }, [playlistId]);

  // オンライン復帰時の同期
  const prevOnlineRef = useRef(isOnline);
  useEffect(() => {
    if (!autoSync || !playlistId) return;

    // オフライン → オンライン への遷移を検出
    if (!prevOnlineRef.current && isOnline) {
      console.log("[useSyncPlaylistSongs] Online restored, triggering sync");
      sync();
    }
    prevOnlineRef.current = isOnline;
  }, [autoSync, isOnline, playlistId, sync]);

  return {
    sync,
    isSyncing,
  };
};
