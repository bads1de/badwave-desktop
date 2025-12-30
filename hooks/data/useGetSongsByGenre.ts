import { Song } from "@/types";
import { useQuery, onlineManager } from "@tanstack/react-query";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";
import { createClient } from "@/libs/supabase/client";
import { isNetworkError } from "@/libs/electron/index";

/**
 * 指定したジャンルの曲一覧を取得するカスタムフック (オフライン対応)
 *
 * onlineManager により、オフライン時はクエリが自動的に pause されます。
 * PersistQueryClient により、オフライン時や起動時は即座にキャッシュから表示されます。
 *
 * @param genre ジャンル名またはジャンル名の配列
 * @returns 曲の配列とローディング状態
 */
const useGetSongsByGenre = (genre: string | string[]) => {
  const supabase = createClient();

  // ジャンルが文字列の場合は、カンマで分割して配列に変換
  const genreArray =
    typeof genre === "string" ? genre.split(",").map((g) => g.trim()) : genre;

  const queryKey = [CACHED_QUERIES.songsByGenres, genreArray.join(",")];

  const {
    data: songs = [],
    isLoading,
    error,
    fetchStatus,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (genreArray.length === 0) {
        return [];
      }

      // オフライン時はフェッチをスキップ
      if (!onlineManager.isOnline()) {
        return undefined;
      }

      // データベースから曲を検索
      const { data, error } = await supabase
        .from("songs")
        .select("*")
        .or(genreArray.map((g) => `genre.ilike.%${g}%`).join(","))
        .order("created_at", { ascending: false });

      if (error) {
        if (!onlineManager.isOnline() || isNetworkError(error)) {
          console.log(
            "[useGetSongsByGenre] Fetch skipped: offline/network error"
          );
          return undefined;
        }
        console.error("Error fetching songs by genre:", error.message);
        throw error;
      }

      return (data as Song[]) || [];
    },
    enabled: genreArray.length > 0,
    staleTime: CACHE_CONFIG.staleTime,
    gcTime: CACHE_CONFIG.gcTime,
    retry: false,
  });

  const isPaused = fetchStatus === "paused";

  return { songs, isLoading, error, isPaused };
};

export default useGetSongsByGenre;
