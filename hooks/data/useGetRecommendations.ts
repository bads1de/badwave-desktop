import { Song, SongWithRecommendation } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";
import { useOfflineCache } from "@/hooks/utils/useOfflineCache";
import { createClient } from "@/libs/supabase/client";
import { useUser } from "@/hooks/auth/useUser";
import { useEffect, useRef } from "react";

/**
 * おすすめ曲を取得するカスタムフック (クライアントサイド)
 *
 * @param {Song[]} initialData - サーバーから取得した初期データ（Optional）
 * @param {number} limit - 取得する曲数の上限
 * @returns {Object} おすすめ曲の取得状態と結果
 */
const useGetRecommendations = (initialData?: Song[], limit: number = 10) => {
  const { isOnline } = useNetworkStatus();
  const { saveToCache, loadFromCache } = useOfflineCache();
  const supabase = createClient();
  const { user } = useUser();

  const queryKey = [CACHED_QUERIES.recommendations, user?.id, limit];

  const {
    data: recommendations = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      // オフラインの場合はキャッシュから取得を試みる
      if (!isOnline) {
        const cachedData = await loadFromCache<Song[]>(queryKey.join(":"));
        if (cachedData) return cachedData;
        return [];
      }

      // ユーザーがログインしていない場合は空配列を返す
      if (!user?.id) {
        return [];
      }

      // オンラインの場合はSupabaseから取得
      try {
        const { data, error } = await supabase.rpc("get_recommendations", {
          p_user_id: user.id,
          p_limit: limit,
        });

        if (error) {
          console.error("Error fetching recommendations:", error);
          throw error;
        }

        if (!data) return [];

        const result: Song[] = data.map((item: SongWithRecommendation) => ({
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

        // バックグラウンドでキャッシュに保存
        saveToCache(queryKey.join(":"), result).catch(console.error);

        return result;
      } catch (e) {
        console.error("Exception in getRecommendations:", e);
        return [];
      }
    },
    initialData: initialData,
    enabled: !!user?.id && isOnline, // オフライン時はクエリを無効化
    staleTime: CACHE_CONFIG.staleTime,
    gcTime: CACHE_CONFIG.gcTime,
    retry: isOnline ? 1 : false,
  });

  const prevIsOnline = useRef(isOnline);

  // オンラインに戻ったときに再取得
  useEffect(() => {
    if (!prevIsOnline.current && isOnline && user?.id) {
      refetch();
    }
    prevIsOnline.current = isOnline;
  }, [isOnline, user?.id, refetch]);

  return { recommendations, isLoading, error };
};

export default useGetRecommendations;
