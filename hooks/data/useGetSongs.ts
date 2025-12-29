import { Song } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";
import { createClient } from "@/libs/supabase/client";

/**
 * 最新曲を取得するカスタムフック (クライアントサイド)
 *
 * PersistQueryClient により、オフライン時や起動時は即座にキャッシュから表示されます。
 *
 * @param {Song[]} initialData - サーバーから取得した初期データ（Optional）
 * @param {number} limit - 取得する曲数の上限
 * @returns {Object} 曲の取得状態と結果
 */
const useGetSongs = (initialData?: Song[], limit: number = 12) => {
  const { isOnline } = useNetworkStatus();
  const supabase = createClient();

  const queryKey = [CACHED_QUERIES.songs, limit];

  const {
    data: songs = [],
    isLoading,
    error,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      // オンラインの場合はSupabaseから取得
      const { data, error } = await supabase
        .from("songs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Error fetching songs:", error.message);
        throw error;
      }

      return (data as Song[]) || [];
    },
    initialData: initialData,
    staleTime: CACHE_CONFIG.staleTime,
    gcTime: CACHE_CONFIG.gcTime,
    // オフライン時はフェッチをスキップ（キャッシュが表示される）
    enabled: isOnline,
    retry: false,
  });

  return { songs, isLoading, error };
};

export default useGetSongs;
