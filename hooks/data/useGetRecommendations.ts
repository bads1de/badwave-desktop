import { Song, SongWithRecommendation } from "@/types";
import { useQuery, onlineManager } from "@tanstack/react-query";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";
import { createClient } from "@/libs/supabase/client";
import { useUser } from "@/hooks/auth/useUser";
import { isNetworkError, electronAPI } from "@/libs/electron-utils";

/**
 * おすすめ曲を取得するカスタムフック (クライアントサイド)
 *
 * onlineManager により、オフライン時はクエリが自動的に pause されます。
 * PersistQueryClient により、オフライン時や起動時は即座にキャッシュから表示されます。
 *
 * @param {Song[]} initialData - サーバーから取得した初期データ（Optional）
 * @param {number} limit - 取得する曲数の上限
 * @returns {Object} おすすめ曲の取得状態と結果
 */
const useGetRecommendations = (initialData?: Song[], limit: number = 10) => {
  const supabase = createClient();
  const { user } = useUser();

  const queryKey = [CACHED_QUERIES.recommendations, user?.id, limit];

  const {
    data: recommendations = [],
    isLoading,
    error,
    fetchStatus,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      // ユーザーがログインしていない場合は空配列を返す
      if (!user?.id) {
        return [];
      }

      // Electron環境: ローカルキャッシュから取得
      if (electronAPI.isElectron()) {
        const cacheKey = `home_recommendations_${user.id}`;
        const cachedSongs = await electronAPI.cache.getSectionData(
          cacheKey,
          "songs"
        );
        // ローカルDBのSong型をUIのSong型（ローカルパス付き）として返す
        return (cachedSongs as Song[]) || [];
      }

      // オフライン時はフェッチをスキップ
      if (!onlineManager.isOnline()) {
        return undefined;
      }

      try {
        const { data, error } = await supabase.rpc("get_recommendations", {
          p_user_id: user.id,
          p_limit: limit,
        });

        if (error) {
          if (!onlineManager.isOnline() || isNetworkError(error)) {
            console.log(
              "[useGetRecommendations] Fetch skipped: offline/network error"
            );
            return undefined;
          }
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

        return result;
      } catch (e) {
        console.error("Exception in getRecommendations:", e);
        return [];
      }
    },
    initialData: initialData,
    enabled: !!user?.id,
    staleTime: CACHE_CONFIG.staleTime,
    gcTime: CACHE_CONFIG.gcTime,
    retry: false,
    networkMode: "always",
  });

  const isPaused = fetchStatus === "paused";

  return { recommendations, isLoading, error, isPaused };
};

export default useGetRecommendations;
