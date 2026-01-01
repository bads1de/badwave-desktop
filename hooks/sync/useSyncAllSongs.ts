import { useState, useCallback, useRef, useEffect } from "react";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";
import { createClient } from "@/libs/supabase/client";
import { electronAPI } from "@/libs/electron/index";
import { useQueryClient } from "@tanstack/react-query";
import { CACHED_QUERIES } from "@/constants";

/**
 * 全曲をバックグラウンドで同期する Syncer フック
 *
 * Supabase から曲をページ分割で取得し、ローカル DB に保存します。
 * Latest Songs の同期とは異なり、全曲を対象とします。
 */
export const useSyncAllSongs = (options?: { autoSync?: boolean }) => {
  const { autoSync = true } = options ?? {};
  const { isOnline } = useNetworkStatus();
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);
  const syncInProgress = useRef(false);
  const hasInitialSynced = useRef(false);

  const isOnlineRef = useRef(isOnline);
  useEffect(() => {
    isOnlineRef.current = isOnline;
  }, [isOnline]);

  const sync = useCallback(async () => {
    if (!isOnlineRef.current || !electronAPI.isElectron()) {
      return { success: false, reason: "conditions_not_met" };
    }

    if (syncInProgress.current) {
      return { success: false, reason: "already_syncing" };
    }

    syncInProgress.current = true;
    setIsSyncing(true);

    try {
      const supabase = createClient();
      const pageSize = 100;
      let offset = 0;
      let totalSynced = 0;
      let hasMore = true;

      // ページ分割で全曲を取得・同期
      while (hasMore) {
        const { data, error } = await supabase
          .from("songs")
          .select("*")
          .order("created_at", { ascending: false })
          .range(offset, offset + pageSize - 1);

        if (error) throw error;

        if (data && data.length > 0) {
          // メタデータを保存
          await electronAPI.cache.syncSongsMetadata(data);
          totalSynced += data.length;
          offset += pageSize;
          hasMore = data.length === pageSize;
        } else {
          hasMore = false;
        }
      }

      console.log(`[useSyncAllSongs] Synced ${totalSynced} songs`);

      // キャッシュ無効化（ページネーションクエリ）
      await queryClient.invalidateQueries({
        queryKey: [CACHED_QUERIES.songs, "paginated"],
      });

      return { success: true, count: totalSynced };
    } catch (error) {
      console.error("[useSyncAllSongs] Sync failed:", error);
      return { success: false, reason: "error", error };
    } finally {
      syncInProgress.current = false;
      setIsSyncing(false);
    }
  }, [queryClient]);

  // 自動同期
  useEffect(() => {
    if (!autoSync) return;
    if (isOnline && !hasInitialSynced.current) {
      hasInitialSynced.current = true;
      sync();
    }
  }, [autoSync, isOnline, sync]);

  // オンライン復帰時の同期
  const prevOnlineRef = useRef(isOnline);
  useEffect(() => {
    if (!autoSync) return;
    if (!prevOnlineRef.current && isOnline) {
      sync();
    }
    prevOnlineRef.current = isOnline;
  }, [autoSync, isOnline, sync]);

  return { sync, isSyncing };
};
