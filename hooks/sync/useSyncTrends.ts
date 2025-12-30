import { useState, useCallback, useRef, useEffect } from "react";
import { useUser } from "@/hooks/auth/useUser";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";
import { createClient } from "@/libs/supabase/client";
import { electronAPI } from "@/libs/electron-utils";
import { Song } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import { CACHED_QUERIES } from "@/constants";
import { subMonths, subWeeks, subDays } from "date-fns";

/**
 * トレンド情報をバックグラウンドで同期する Syncer フック
 */
export const useSyncTrends = (
  period: "all" | "month" | "week" | "day" = "all",
  options?: { autoSync?: boolean }
) => {
  const { autoSync = true } = options ?? {};
  const { user } = useUser(); // トレンドはPublicだが、同期ロジック統一のため
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
      let query = supabase.from("songs").select("*");

      switch (period) {
        case "month":
          query = query.filter(
            "created_at",
            "gte",
            subMonths(new Date(), 1).toISOString()
          );
          break;
        case "week":
          query = query.filter(
            "created_at",
            "gte",
            subWeeks(new Date(), 1).toISOString()
          );
          break;
        case "day":
          query = query.filter(
            "created_at",
            "gte",
            subDays(new Date(), 1).toISOString()
          );
          break;
      }

      const { data, error } = await query
        .order("count", { ascending: false })
        .limit(10);

      if (error) throw error;

      if (data) {
        // 1. メタデータを保存
        await electronAPI.cache.syncSongsMetadata(data);

        // 2. セクション順序を保存
        const cacheKey = `trend_${period}`;
        await electronAPI.cache.syncSection({ key: cacheKey, data });

        console.log(
          `[useSyncTrends] Synced ${data.length} songs for ${cacheKey}`
        );

        // キャッシュ無効化
        await queryClient.invalidateQueries({
          queryKey: [CACHED_QUERIES.trendSongs, period],
        });

        return { success: true, count: data.length };
      }

      return { success: true, count: 0 };
    } catch (error) {
      console.error("[useSyncTrends] Sync failed:", error);
      return { success: false, reason: "error", error };
    } finally {
      syncInProgress.current = false;
      setIsSyncing(false);
    }
  }, [period, queryClient]);

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
