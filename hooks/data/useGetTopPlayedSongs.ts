import { Song } from "@/types";
import { createClient } from "@/libs/supabase/client";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";
import { useOfflineCache } from "@/hooks/utils/useOfflineCache";
import { useEffect, useRef } from "react";

interface TopPlayedSong extends Song {
  play_count: number;
}

type Period = "day" | "week" | "month" | "all";

const useGetTopPlayedSongs = (userId?: string, period: Period = "day") => {
  const supabase = createClient();
  const { isOnline } = useNetworkStatus();
  const { saveToCache, loadFromCache } = useOfflineCache();

  const queryKey = [CACHED_QUERIES.getTopSongs, userId, period];

  const {
    data: topSongs,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!userId) {
        return [];
      }

      // オフラインの場合はキャッシュから取得を試みる
      if (!isOnline) {
        const cachedData = await loadFromCache<TopPlayedSong[]>(
          queryKey.join(":")
        );
        if (cachedData) return cachedData;
        return [];
      }

      const { data, error } = await supabase.rpc("get_top_songs", {
        p_user_id: userId,
        p_period: period,
      });

      if (error) {
        throw new Error(`再生履歴の取得に失敗しました: ${error.message}`);
      }

      const result = (data || []) as TopPlayedSong[];

      // バックグラウンドでキャッシュに保存
      saveToCache(queryKey.join(":"), result).catch(console.error);

      return result;
    },
    staleTime: CACHE_CONFIG.staleTime,
    gcTime: CACHE_CONFIG.gcTime,
    enabled: !!userId,
    placeholderData: keepPreviousData,
    retry: isOnline ? 1 : false,
  });

  const prevIsOnline = useRef(isOnline);

  // オンラインに戻ったときに再取得
  useEffect(() => {
    if (!prevIsOnline.current && isOnline && userId) {
      refetch();
    }
    prevIsOnline.current = isOnline;
  }, [isOnline, userId, refetch]);

  return {
    topSongs: topSongs ?? [],
    isLoading,
    error,
  };
};

export default useGetTopPlayedSongs;
