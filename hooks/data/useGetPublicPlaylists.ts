import { Playlist } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";
import { useOfflineCache } from "@/hooks/utils/useOfflineCache";
import { createClient } from "@/libs/supabase/client";
import { useEffect, useRef } from "react";

/**
 * パブリックプレイリストを取得するカスタムフック (クライアントサイド)
 *
 * @param {Playlist[]} initialData - サーバーから取得した初期データ（Optional）
 * @param {number} limit - 取得するプレイリスト数の上限
 * @returns {Object} パブリックプレイリストの取得状態と結果
 */
const useGetPublicPlaylists = (initialData?: Playlist[], limit: number = 6) => {
  const { isOnline } = useNetworkStatus();
  const { saveToCache, loadFromCache } = useOfflineCache();
  const supabase = createClient();

  const queryKey = [CACHED_QUERIES.publicPlaylists, limit];

  const {
    data: playlists = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      // オフラインの場合はキャッシュから取得を試みる
      if (!isOnline) {
        const cachedData = await loadFromCache<Playlist[]>(queryKey.join(":"));
        if (cachedData) return cachedData;
        return [];
      }

      // オンラインの場合はSupabaseから取得
      const { data, error } = await supabase
        .from("playlists")
        .select("*")
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Error fetching public playlists:", error.message);
        throw error;
      }

      const result = (data as Playlist[]) || [];

      // バックグラウンドでキャッシュに保存
      saveToCache(queryKey.join(":"), result).catch(console.error);

      return result;
    },
    initialData: initialData,
    staleTime: CACHE_CONFIG.staleTime,
    gcTime: CACHE_CONFIG.gcTime,
    retry: isOnline ? 1 : false,
  });

  const prevIsOnline = useRef(isOnline);

  // オンラインに戻ったときに再取得
  useEffect(() => {
    if (!prevIsOnline.current && isOnline) {
      refetch();
    }
    prevIsOnline.current = isOnline;
  }, [isOnline, refetch]);

  return { playlists, isLoading, error };
};

export default useGetPublicPlaylists;
