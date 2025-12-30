import { useState, useCallback, useRef, useEffect } from "react";
import { useUser } from "@/hooks/auth/useUser";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";
import { createClient } from "@/libs/supabase/client";
import { electronAPI } from "@/libs/electron-utils";
import { useQueryClient } from "@tanstack/react-query";
import { CACHED_QUERIES } from "@/constants";
import { Song, SongWithRecommendation } from "@/types";

/**
 * おすすめ曲（Recommendations）をバックグラウンドで同期する Syncer フック
 */
export const useSyncRecommendations = (
  limit: number = 10,
  options?: { autoSync?: boolean }
) => {
  const { autoSync = true } = options ?? {};
  const { user } = useUser();
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
    if (!isOnlineRef.current || !user?.id || !electronAPI.isElectron()) {
      return { success: false, reason: "conditions_not_met" };
    }

    if (syncInProgress.current) {
      return { success: false, reason: "already_syncing" };
    }

    syncInProgress.current = true;
    setIsSyncing(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("get_recommendations", {
        p_user_id: user.id,
        p_limit: limit,
      });

      if (error) throw error;

      if (data) {
        const songs: Song[] = data.map((item: SongWithRecommendation) => ({
          id: item.id,
          title: item.title,
          author: item.author,
          song_path: item.song_path,
          image_path: item.image_path,
          genre: item.genre,
          count: item.count,
          like_count: item.like_count,
          created_at: item.created_at,
          user_id: user.id,
        }));

        // 1. メタデータを保存
        await electronAPI.cache.syncSongsMetadata(songs);

        // 2. セクション順序を保存
        const cacheKey = `home_recommendations_${user.id}`;
        await electronAPI.cache.syncSection({ key: cacheKey, data: songs });

        console.log(`[useSyncRecommendations] Synced ${songs.length} songs`);

        // キャッシュ無効化
        await queryClient.invalidateQueries({
          queryKey: [CACHED_QUERIES.recommendations, user.id, limit],
        });

        return { success: true, count: songs.length };
      }

      return { success: true, count: 0 };
    } catch (error) {
      console.error("[useSyncRecommendations] Sync failed:", error);
      return { success: false, reason: "error", error };
    } finally {
      syncInProgress.current = false;
      setIsSyncing(false);
    }
  }, [user?.id, limit, queryClient]);

  // 自動同期
  useEffect(() => {
    if (!autoSync) return;
    if (isOnline && user?.id && !hasInitialSynced.current) {
      hasInitialSynced.current = true;
      sync();
    }
  }, [autoSync, isOnline, user?.id, sync]);

  // オンライン復帰時の同期
  const prevOnlineRef = useRef(isOnline);
  useEffect(() => {
    if (!autoSync) return;
    if (!prevOnlineRef.current && isOnline && user?.id) {
      sync();
    }
    prevOnlineRef.current = isOnline;
  }, [autoSync, isOnline, user?.id, sync]);

  return { sync, isSyncing };
};
