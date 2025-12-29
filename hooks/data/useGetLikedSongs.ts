import { Song } from "@/types";
import { createClient } from "@/libs/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";
import { useOfflineCheck } from "@/hooks/utils/useOfflineCheck";
import { electronAPI } from "@/libs/electron-utils";
import { useEffect, useRef } from "react";

/**
 * ユーザーがいいねした曲を取得するカスタムフック
 *
 * オフライン対応 (SQLiteキャッシュ使用)
 */
const useGetLikedSongs = (userId?: string) => {
  const supabaseClient = createClient();
  const { isOnline, isInitialized, checkOffline } = useOfflineCheck();

  const queryKey = [CACHED_QUERIES.likedSongs, userId];

  const {
    data: likedSongs = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!userId) {
        return [];
      }

      // 直接オフライン状態を確認（クロージャのタイミング問題を回避）
      const isCurrentlyOffline = await checkOffline();

      // オフラインの場合は SQLite キャッシュから取得
      if (isCurrentlyOffline) {
        try {
          const cachedData = await electronAPI.cache.getCachedLikedSongs(
            userId
          );
          if (cachedData && cachedData.length > 0) {
            return cachedData as Song[];
          }
        } catch (e) {
          console.error("Failed to load liked songs from SQLite cache:", e);
        }
        return [];
      }

      // オンラインの場合は Supabase から取得
      const { data, error } = await supabaseClient
        .from("liked_songs_regular")
        .select("*, songs(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching liked songs:", error);
        throw new Error("いいねした曲の取得に失敗しました");
      }

      if (!data) return [];

      const songs = data.map((item) => ({
        ...item.songs,
        songType: "regular" as const,
      })) as Song[];

      // キャッシュ同期（バックグラウンド）
      if (electronAPI.isElectron()) {
        electronAPI.cache.syncLikedSongs(userId, songs).catch((e) => {
          console.error("Failed to sync liked songs with metadata:", e);
        });
      }

      return songs;
    },
    staleTime: CACHE_CONFIG.staleTime,
    gcTime: CACHE_CONFIG.gcTime,
    enabled: !!userId && isInitialized,
    retry: isOnline ? 1 : false,
  });

  const prevIsOnline = useRef(isOnline);

  useEffect(() => {
    if (!prevIsOnline.current && isOnline && userId) {
      refetch();
    }
    prevIsOnline.current = isOnline;
  }, [isOnline, userId, refetch]);

  return { likedSongs, isLoading, error };
};

export default useGetLikedSongs;
