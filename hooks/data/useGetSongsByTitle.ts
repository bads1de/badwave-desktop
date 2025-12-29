import { Song } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";
import { useOfflineCache } from "@/hooks/utils/useOfflineCache";
import { createClient } from "@/libs/supabase/client";
import { useEffect, useRef } from "react";

/**
 * タイトルで曲を検索するカスタムフック (オフライン対応)
 * @param title 検索するタイトル
 * @returns 曲の配列とローディング状態
 */
const useGetSongsByTitle = (title: string) => {
  const supabase = createClient();
  const { isOnline } = useNetworkStatus();
  const { saveToCache, loadFromCache } = useOfflineCache();

  const queryKey = [CACHED_QUERIES.songs, "search", title];

  const {
    data: songs = [],
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

      const result = (data as Song[]) || [];

      // バックグラウンドでキャッシュに保存
      saveToCache(queryKey.join(":"), result).catch(console.error);

      return result;
    },
    staleTime: CACHE_CONFIG.staleTime,
    gcTime: CACHE_CONFIG.gcTime,
    retry: isOnline ? 1 : false,
  });

  const prevIsOnline = useRef(isOnline);

  // オンラインに戻ったときに再取得
  useEffect(() => {
    if (!prevIsOnline.current && isOnline && title) {
      refetch();
    }
    prevIsOnline.current = isOnline;
  }, [isOnline, title, refetch]);

  return { songs, isLoading, error };
};

export default useGetSongsByTitle;
