import { Song } from "@/types";
import { createClient } from "@/libs/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";
import { useOfflineCache } from "@/hooks/utils/useOfflineCache";
import { useEffect } from "react";

/**
 * プレイリストの曲を取得するカスタムフック
 *
 * @param playlistId プレイリストID
 * @returns プレイリストの曲のリストとローディング状態
 */
const useGetPlaylistSongs = (playlistId?: string) => {
  const supabaseClient = createClient();
  const { isOnline } = useNetworkStatus();
  const { saveToCache, loadFromCache } = useOfflineCache();

  const queryKey = [CACHED_QUERIES.playlists, playlistId, "songs"];

  const {
    data: songs = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!playlistId) {
        return [];
      }

      // オフラインの場合はキャッシュから取得を試みる
      if (!isOnline) {
        const cachedData = await loadFromCache<Song[]>(queryKey.join(":"));
        if (cachedData) return cachedData;
        return [];
      }

      const { data, error } = await supabaseClient
        .from("playlist_songs")
        .select("*, songs(*)")
        .eq("playlist_id", playlistId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching playlist songs:", error);
        throw new Error("プレイリストの曲の取得に失敗しました");
      }

      // データがなければ空の配列を返す
      if (!data) {
        return [];
      }

      // 取得したデータから曲の情報のみを新しい配列にして返す
      const mappedSongs = data.map((item) => ({
        ...item.songs,
        songType: "regular" as const,
      })) as Song[];

      // バックグラウンドでキャッシュに保存
      saveToCache(queryKey.join(":"), mappedSongs).catch(console.error);

      return mappedSongs;
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
    songs,
    isLoading,
    error,
  };
};

export default useGetPlaylistSongs;
