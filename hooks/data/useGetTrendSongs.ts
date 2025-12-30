import { Song } from "@/types";
import { useQuery, onlineManager } from "@tanstack/react-query";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";
import { createClient } from "@/libs/supabase/client";
import { subMonths, subWeeks, subDays } from "date-fns";
import { isNetworkError } from "@/libs/electron-utils";

/**
 * トレンド曲を取得するカスタムフック
 *
 * onlineManager により、オフライン時はクエリが自動的に pause されます。
 * PersistQueryClient により、オフライン時や起動時は即座にキャッシュから表示されます。
 */
const useGetTrendSongs = (
  period: "all" | "month" | "week" | "day" = "all",
  initialData?: Song[]
) => {
  const supabase = createClient();

  const queryKey = [CACHED_QUERIES.trendSongs, period];

  const {
    data: trends = [],
    isLoading,
    error,
    fetchStatus,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      // オフライン時はフェッチをスキップ
      if (!onlineManager.isOnline()) {
        return undefined;
      }

      let query = supabase.from("songs").select("*");

      switch (period) {
        case "month":
          query = query.filter(
            "created_at",
            "gte",
            subMonths(new Date(), 1).toISOString()
          );
          break;
        case "week":
          query = query.filter(
            "created_at",
            "gte",
            subWeeks(new Date(), 1).toISOString()
          );
          break;
        case "day":
          query = query.filter(
            "created_at",
            "gte",
            subDays(new Date(), 1).toISOString()
          );
          break;
      }

      const { data, error } = await query
        .order("count", { ascending: false })
        .limit(10);

      if (error) {
        if (!onlineManager.isOnline() || isNetworkError(error)) {
          console.log(
            "[useGetTrendSongs] Fetch skipped: offline/network error"
          );
          return undefined;
        }
        console.error("Error fetching trend songs:", error.message);
        throw error;
      }

      return (data as Song[]) || [];
    },
    initialData: initialData,
    staleTime: CACHE_CONFIG.staleTime,
    gcTime: CACHE_CONFIG.gcTime,
    retry: false,
  });

  // fetchStatus: 'paused' はオフライン状態を示す
  const isPaused = fetchStatus === "paused";

  return { trends, isLoading, error, isPaused };
};

export default useGetTrendSongs;
