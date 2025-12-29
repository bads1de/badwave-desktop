import { Song } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";
import { createClient } from "@/libs/supabase/client";

/**
 * タイトルで曲を検索するカスタムフック (オフライン対応)
 *
 * PersistQueryClient により、オフライン時や起動時は即座にキャッシュから表示されます。
 *
 * @param title 検索するタイトル
 * @returns 曲の配列とローディング状態
 */
const useGetSongsByTitle = (title: string) => {
  const supabase = createClient();
  const { isOnline } = useNetworkStatus();

  const queryKey = [CACHED_QUERIES.songs, "search", title];

  const {
    data: songs = [],
    isLoading,
    error,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const query = supabase
        .from("songs")
        .select("*")
        .order("created_at", { ascending: false });

      // タイトルが指定されている場合のみフィルタを追加
      if (title) {
        query.ilike("title", `%${title}%`);
      }

      const { data, error } = await query.limit(20);

      if (error) {
        console.error("Error fetching songs by title:", error.message);
        throw error;
      }

      return (data as Song[]) || [];
    },
    staleTime: CACHE_CONFIG.staleTime,
    gcTime: CACHE_CONFIG.gcTime,
    enabled: isOnline,
    retry: false,
  });

  return { songs, isLoading, error };
};

export default useGetSongsByTitle;
