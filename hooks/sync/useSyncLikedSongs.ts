import { useState, useCallback, useRef, useEffect } from "react";
import { useUser } from "@/hooks/auth/useUser";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";
import { createClient } from "@/libs/supabase/client";
import { electronAPI } from "@/libs/electron/index";
import { Song } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import { CACHED_QUERIES } from "@/constants";

/**
 * Liked Songs をバックグラウンドで同期する Syncer フック
 *
 * このフックは、オンライン時に Supabase から最新の Liked Songs を取得し、
 * ローカル DB に同期（Upsert）します。同期完了後、React Query のキャッシュを
 * 無効化して UI を更新します。
 *
 * @param options.autoSync - true の場合、マウント時およびオンライン復帰時に自動同期
 * @returns sync - 手動で同期をトリガーする関数
 * @returns isSyncing - 現在同期中かどうか
 */
export const useSyncLikedSongs = (options?: { autoSync?: boolean }) => {
  const { autoSync = true } = options ?? {};
  const { user } = useUser();
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
    if (!isOnlineRef.current || !user?.id || !electronAPI.isElectron()) {
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
        .from("liked_songs_regular")
        .select("*, songs(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        const songs = data.map((item: any) => ({
          ...item.songs,
          songType: "regular",
        })) as Song[];

        await electronAPI.cache.syncLikedSongs({ userId: user.id, songs });
        console.log(`[useSyncLikedSongs] Synced ${songs.length} liked songs`);

        // キャッシュを無効化してUIを更新
        await queryClient.invalidateQueries({
          queryKey: [CACHED_QUERIES.likedSongs],
        });

        return { success: true, count: songs.length };
      }

      return { success: true, count: 0 };
    } catch (error) {
      console.error("[useSyncLikedSongs] Sync failed:", error);
      return { success: false, reason: "error", error };
    } finally {
      syncInProgress.current = false;
      setIsSyncing(false);
    }
  }, [user?.id, queryClient]);

  // 自動同期: マウント時およびオンライン復帰時
  useEffect(() => {
    if (!autoSync) return;

    // 初回同期またはオンライン復帰時に同期
    if (isOnline && user?.id && !hasInitialSynced.current) {
      hasInitialSynced.current = true;
      sync();
    }
  }, [autoSync, isOnline, user?.id, sync]);

  // オンライン復帰時の同期
  const prevOnlineRef = useRef(isOnline);
  useEffect(() => {
    if (!autoSync) return;

    // オフライン → オンライン への遷移を検出
    if (!prevOnlineRef.current && isOnline && user?.id) {
      console.log("[useSyncLikedSongs] Online restored, triggering sync");
      sync();
    }
    prevOnlineRef.current = isOnline;
  }, [autoSync, isOnline, user?.id, sync]);

  return {
    sync,
    isSyncing,
  };
};
