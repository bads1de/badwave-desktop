import { Song } from "@/types";
import { createClient } from "@/libs/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";
import { useOfflineCache } from "@/hooks/utils/useOfflineCache";
import { useEffect } from "react";

/**
 * 指定されたジャンルに一致する曲を取得するカスタムフック
 *
 * @param genres 取得する曲のジャンルの配列
 * @param excludeId 除外する曲のID（オプション）
 * @returns 取得した曲の配列、ローディング状態、エラー
 */
const useGetSongsByGenres = (genres: string[], excludeId?: string) => {
  const supabaseClient = createClient();
  const { isOnline } = useNetworkStatus();
  const { saveToCache, loadFromCache } = useOfflineCache();

  const queryKey = [CACHED_QUERIES.songsByGenres, genres, excludeId];

  const {
    data: songGenres = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (genres.length === 0) {
        return [];
      }

      // オフラインの場合はキャッシュから取得を試みる
      if (!isOnline) {
        // excludeIdが含まれるキーのキャッシュを探す
        // Note: 単純化のため、キーそのもので検索します
        const cachedData = await loadFromCache<Song[]>(queryKey.join(":"));
        if (cachedData) return cachedData;
        return [];
      }

      let query = supabaseClient.from("songs").select("*");

      // ジャンルのOR条件を構築
      const genreConditions = genres.map((genre) => `genre.ilike.%${genre}%`);
      query = query.or(genreConditions.join(","));

      if (excludeId) {
        query = query.neq("id", excludeId);
      }

      query = query.limit(3);

      const { data, error } = await query;

      if (error) {
        throw new Error(
          `ジャンルによる曲の取得に失敗しました: ${error.message}`
        );
      }

      const result = (data as Song[]) || [];

      // バックグラウンドでキャッシュに保存
      saveToCache(queryKey.join(":"), result).catch(console.error);

      return result;
    },
    staleTime: CACHE_CONFIG.staleTime,
    gcTime: CACHE_CONFIG.gcTime,
    enabled: genres.length > 0,
    retry: isOnline ? 1 : false,
  });

  // オンラインに戻ったときに再取得
  useEffect(() => {
    if (isOnline && genres.length > 0) {
      refetch();
    }
  }, [isOnline, genres, refetch]);

  if (error && isOnline) {
    console.error(error);
  }

  return {
    isLoading,
    songGenres,
  };
};

export default useGetSongsByGenres;
