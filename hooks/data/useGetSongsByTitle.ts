import { Song } from "@/types";
import { useQuery, onlineManager } from "@tanstack/react-query";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";
import { createClient } from "@/libs/supabase/client";
import { isNetworkError } from "@/libs/electron/index";

/**
 * タイトルで曲を検索するカスタムフック (オフライン対応)
 *
 * onlineManager により、オフライン時はクエリが自動的に pause されます。
 * PersistQueryClient により、オフライン時や起動時は即座にキャッシュから表示されます。
 *
 * @param title 検索するタイトル
 * @returns 曲の配列とローディング状態
 */
const useGetSongsByTitle = (title: string) => {
  const supabase = createClient();

  const queryKey = [CACHED_QUERIES.songs, "search", title];

  const {
    data: songs = [],
    isLoading,
    error,
    fetchStatus,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      // オフライン時はフェッチをスキップ
      if (!onlineManager.isOnline()) {
        return undefined;
      }

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
        if (!onlineManager.isOnline() || isNetworkError(error)) {
          console.log(
            "[useGetSongsByTitle] Fetch skipped: offline/network error"
          );
          return undefined;
        }
        console.error("Error fetching songs by title:", error.message);
        throw error;
      }

      return (data as Song[]) || [];
    },
    staleTime: CACHE_CONFIG.staleTime,
    gcTime: CACHE_CONFIG.gcTime,
    retry: false,
  });

  const isPaused = fetchStatus === "paused";

  return { songs, isLoading, error, isPaused };
};

export default useGetSongsByTitle;
