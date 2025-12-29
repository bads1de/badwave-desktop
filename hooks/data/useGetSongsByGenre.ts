import { Song } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";
import { createClient } from "@/libs/supabase/client";

/**
 * 指定したジャンルの曲一覧を取得するカスタムフック (オフライン対応)
 *
 * PersistQueryClient により、オフライン時や起動時は即座にキャッシュから表示されます。
 *
 * @param genre ジャンル名またはジャンル名の配列
 * @returns 曲の配列とローディング状態
 */
const useGetSongsByGenre = (genre: string | string[]) => {
  const supabase = createClient();
  const { isOnline } = useNetworkStatus();

  // ジャンルが文字列の場合は、カンマで分割して配列に変換
  const genreArray =
    typeof genre === "string" ? genre.split(",").map((g) => g.trim()) : genre;

  const queryKey = [CACHED_QUERIES.songsByGenres, genreArray.join(",")];

  const {
    data: songs = [],
    isLoading,
    error,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (genreArray.length === 0) {
        return [];
      }

      // データベースから曲を検索
      const { data, error } = await supabase
        .from("songs")
        .select("*")
        .or(genreArray.map((g) => `genre.ilike.%${g}%`).join(","))
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching songs by genre:", error.message);
        throw error;
      }

      return (data as Song[]) || [];
    },
    enabled: genreArray.length > 0 && isOnline,
    staleTime: CACHE_CONFIG.staleTime,
    gcTime: CACHE_CONFIG.gcTime,
    retry: false,
  });

  return { songs, isLoading, error };
};

export default useGetSongsByGenre;
