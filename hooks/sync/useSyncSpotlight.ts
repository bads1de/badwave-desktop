import { useState, useCallback, useRef, useEffect } from "react";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";
import { createClient } from "@/libs/supabase/client";
import { electronAPI } from "@/libs/electron/index";
import { useQueryClient } from "@tanstack/react-query";
import { CACHED_QUERIES } from "@/constants";

/**
 * スポットライト情報をバックグラウンドで同期する Syncer フック
 */
export const useSyncSpotlight = (options?: { autoSync?: boolean }) => {
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
      const { data, error } = await supabase
        .from("spotlights")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        // 1. メタデータを保存 (Videos)
        await electronAPI.cache.syncSpotlightsMetadata(data);

        // 2. セクション順序を保存
        const cacheKey = "home_spotlight";
        await electronAPI.cache.syncSection({ key: cacheKey, data });

        console.log(`[useSyncSpotlight] Synced ${data.length} items`);

        // キャッシュ無効化
        await queryClient.invalidateQueries({
          queryKey: [CACHED_QUERIES.spotlight],
        });

        return { success: true, count: data.length };
      }

      return { success: true, count: 0 };
    } catch (error) {
      console.error("[useSyncSpotlight] Sync failed:", error);
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
