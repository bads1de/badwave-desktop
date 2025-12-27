import { Playlist } from "@/types";
import { createClient } from "@/libs/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";
import { useOfflineCache } from "@/hooks/utils/useOfflineCache";
import { useEffect } from "react";

/**
 * プレイリスト情報を取得するカスタムフック
 *
 * @param playlistId プレイリストID
 * @returns プレイリスト情報とローディング状態
 */
const useGetPlaylist = (playlistId?: string) => {
  const supabaseClient = createClient();
  const { isOnline } = useNetworkStatus();
  const { saveToCache, loadFromCache } = useOfflineCache();

  const queryKey = [CACHED_QUERIES.playlists, playlistId];

  const {
    data: playlist,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!playlistId) {
        return null;
      }

      // オフラインの場合はキャッシュから取得を試みる
      if (!isOnline) {
        const cachedData = await loadFromCache<Playlist>(queryKey.join(":"));
        if (cachedData) return cachedData;
        return null;
      }

      const { data, error } = await supabaseClient
        .from("playlists")
        .select("*")
        .eq("id", playlistId)
        .single();

      if (error) {
        console.error("Error fetching playlist:", error);
        throw new Error("プレイリストの取得に失敗しました");
      }

      const result = data as Playlist;

      // バックグラウンドでキャッシュに保存
      saveToCache(queryKey.join(":"), result).catch(console.error);

      return result;
    },
    staleTime: CACHE_CONFIG.staleTime,
    gcTime: CACHE_CONFIG.gcTime,
    enabled: !!playlistId,
    retry: isOnline ? 1 : false,
  });

  // オンラインに戻ったときに再取得
  useEffect(() => {
    if (isOnline && playlistId) {
      refetch();
    }
  }, [isOnline, playlistId, refetch]);

  return {
    playlist,
    isLoading,
    error,
  };
};

export default useGetPlaylist;
