import { Song } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";
import { useOfflineCache } from "@/hooks/utils/useOfflineCache";
import { createClient } from "@/libs/supabase/client";
import { useEffect } from "react";

/**
 * 指定したジャンルの曲一覧を取得するカスタムフック (オフライン対応)
 * @param genre ジャンル名またはジャンル名の配列
 * @returns 曲の配列とローディング状態
 */
const useGetSongsByGenre = (genre: string | string[]) => {
  const supabase = createClient();
  const { isOnline } = useNetworkStatus();
  const { saveToCache, loadFromCache } = useOfflineCache();

  // ジャンルが文字列の場合は、カンマで分割して配列に変換
  const genreArray =
    typeof genre === "string" ? genre.split(",").map((g) => g.trim()) : genre;

  const queryKey = [CACHED_QUERIES.songsByGenres, genreArray.join(",")];

  const {
    data: songs = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (genreArray.length === 0) {
        return [];
      }

      // オフラインの場合はキャッシュから取得を試みる
      if (!isOnline) {
        const cachedData = await loadFromCache<Song[]>(queryKey.join(":"));
        if (cachedData) return cachedData;
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

      const result = (data as Song[]) || [];

      // バックグラウンドでキャッシュに保存
      saveToCache(queryKey.join(":"), result).catch(console.error);

      return result;
    },
    enabled: genreArray.length > 0,
    staleTime: CACHE_CONFIG.staleTime,
    gcTime: CACHE_CONFIG.gcTime,
    retry: isOnline ? 1 : false,
  });

  // オンラインに戻ったときに再取得
  useEffect(() => {
    if (isOnline && genreArray.length > 0) {
      refetch();
    }
  }, [isOnline, genreArray, refetch]);

  return { songs, isLoading, error };
};

export default useGetSongsByGenre;
