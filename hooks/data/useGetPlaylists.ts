import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/libs/supabase/client";
import { Playlist } from "@/types";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";
import { useUser } from "@/hooks/auth/useUser";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";
import { useOfflineCheck } from "@/hooks/utils/useOfflineCheck";
import { electronAPI } from "@/libs/electron-utils";
import { useEffect } from "react";

/**
 * ユーザーのプレイリスト一覧を取得するカスタムフック
 *
 * オフライン対応 (SQLiteキャッシュ使用)
 */
const useGetPlaylists = () => {
  const supabase = createClient();
  const { user } = useUser();
  const { isOnline, isInitialized } = useNetworkStatus();
  const { checkOffline } = useOfflineCheck();

  const queryKey = [CACHED_QUERIES.playlists, "user", user?.id];

  const {
    data: playlists = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user?.id) return [];

      // 直接オフライン状態を確認（クロージャのタイミング問題を回避）
      const isCurrentlyOffline = await checkOffline();

      // オフラインの場合は SQLite キャッシュから取得
      if (isCurrentlyOffline) {
        try {
          const cachedData = await electronAPI.cache.getCachedPlaylists(
            user.id
          );
          if (cachedData && cachedData.length > 0) {
            return cachedData as Playlist[];
          }
        } catch (e) {
          console.error("Failed to load from SQLite cache:", e);
        }
        return [];
      }

      // オンラインの場合は Supabase から取得
      const { data, error } = await supabase
        .from("playlists")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching playlists:", error.message);
        throw error;
      }

      const result = (data as Playlist[]) || [];

      // バックグラウンドで SQLite キャッシュに保存
      electronAPI.cache.syncPlaylists(result).catch((e) => {
        console.error("Failed to sync playlists to cache:", e);
      });

      return result;
    },
    enabled: !!user?.id && isInitialized,
    staleTime: CACHE_CONFIG.staleTime,
    gcTime: CACHE_CONFIG.gcTime,
    retry: isOnline ? 1 : false,
  });

  // オンラインに戻ったときに再取得
  useEffect(() => {
    if (isOnline && user?.id) {
      refetch();
    }
  }, [isOnline, user?.id, refetch]);

  return { playlists, isLoading, error };
};

export default useGetPlaylists;
