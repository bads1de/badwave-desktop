import { Song } from "@/types";
import { createClient } from "@/libs/supabase/client";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";

interface TopPlayedSong extends Song {
  play_count: number;
}

type Period = "day" | "week" | "month" | "all";

/**
 * ユーザーの再生数が多い曲を取得するカスタムフック
 *
 * onlineManager により、オフライン時はクエリが自動的に pause されます。
 * PersistQueryClient により、オフライン時や起動時は即座にキャッシュから表示されます。
 */
const useGetTopPlayedSongs = (userId?: string, period: Period = "day") => {
  const supabase = createClient();

  const queryKey = [CACHED_QUERIES.getTopSongs, userId, period];

  const {
    data: topSongs,
    isLoading,
    error,
    fetchStatus,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!userId) {
        return [];
      }

      const { data, error } = await supabase.rpc("get_top_songs", {
        p_user_id: userId,
        p_period: period,
      });

      if (error) {
        throw new Error(`再生履歴の取得に失敗しました: ${error.message}`);
      }

      return (data || []) as TopPlayedSong[];
    },
    staleTime: CACHE_CONFIG.staleTime,
    gcTime: CACHE_CONFIG.gcTime,
    enabled: !!userId,
    placeholderData: keepPreviousData,
    retry: false,
  });

  const isPaused = fetchStatus === "paused";

  return {
    topSongs: topSongs ?? [],
    isLoading,
    error,
    isPaused,
  };
};

export default useGetTopPlayedSongs;
