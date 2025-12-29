import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/libs/supabase/client";
import { Playlist } from "@/types";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";
import { useOfflineCache } from "@/hooks/utils/useOfflineCache";
import { useEffect, useRef } from "react";

/**
 * タイトルでパブリックプレイリストを検索するカスタムフック (オフライン対応)
 * @param title 検索するタイトル
 * @returns プレイリストの配列とローディング状態
 */
const useGetPlaylistsByTitle = (title: string) => {
  const supabase = createClient();
  const { isOnline } = useNetworkStatus();
  const { saveToCache, loadFromCache } = useOfflineCache();

  const queryKey = [CACHED_QUERIES.playlists, "search", title];

  const {
    data: playlists = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      // タイトルが空の場合は空の配列を返す
      if (!title) {
        return [];
      }

      // オフラインの場合はキャッシュから取得を試みる
      if (!isOnline) {
        const cachedData = await loadFromCache<Playlist[]>(queryKey.join(":"));
        if (cachedData) return cachedData;
        return [];
      }

      const { data, error } = await supabase
        .from("playlists")
        .select("*")
        .eq("is_public", true)
        .ilike("title", `%${title}%`)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching playlists by title:", error.message);
        throw error;
      }

      const result = (data as Playlist[]) || [];

      // バックグラウンドでキャッシュに保存
      saveToCache(queryKey.join(":"), result).catch(console.error);

      return result;
    },
    enabled: !!title,
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

  return { playlists, isLoading, error };
};

export default useGetPlaylistsByTitle;
