import { Song } from "@/types";
import { createClient } from "@/libs/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";
import { useOfflineCache } from "@/hooks/utils/useOfflineCache";
import { useEffect } from "react";

/**
 * ユーザーがいいねした曲を取得するカスタムフック
 *
 * @param userId ユーザーID
 * @returns いいねした曲のリストとローディング状態
 */
const useGetLikedSongs = (userId?: string) => {
  const supabaseClient = createClient();
  const { isOnline } = useNetworkStatus();
  const { saveToCache, loadFromCache } = useOfflineCache();

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

      // オフラインの場合はキャッシュから取得を試みる
      if (!isOnline) {
        const cachedData = await loadFromCache<Song[]>(queryKey.join(":"));
        if (cachedData) return cachedData;
        return [];
      }

      const { data, error } = await supabaseClient
        .from("liked_songs_regular")
        .select("*, songs(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching liked songs:", error);
        throw new Error("いいねした曲の取得に失敗しました");
      }

      // データがなければ空の配列を返す
      if (!data) {
        return [];
      }

      // 取得したデータから曲の情報のみを新しい配列にして返す
      const songs = data.map((item) => ({
        ...item.songs,
        songType: "regular" as const,
      })) as Song[];

      // バックグラウンドでキャッシュに保存
      saveToCache(queryKey.join(":"), songs).catch(console.error);

      return songs;
    },
    staleTime: CACHE_CONFIG.staleTime,
    gcTime: CACHE_CONFIG.gcTime,
    enabled: !!userId,
    retry: isOnline ? 1 : false,
  });

  // オンラインに戻ったときに再取得
  useEffect(() => {
    if (isOnline && userId) {
      refetch();
    }
  }, [isOnline, userId, refetch]);

  return {
    likedSongs,
    isLoading,
    error,
  };
};

export default useGetLikedSongs;
