import { Song } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";
import { createClient } from "@/libs/supabase/client";
import dayjs from "dayjs";

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
      let query = supabase.from("songs").select("*");

      switch (period) {
        case "month":
          query = query.filter(
            "created_at",
            "gte",
            dayjs().subtract(1, "month").toISOString()
          );
          break;
        case "week":
          query = query.filter(
            "created_at",
            "gte",
            dayjs().subtract(1, "week").toISOString()
          );
          break;
        case "day":
          query = query.filter(
            "created_at",
            "gte",
            dayjs().subtract(1, "day").toISOString()
          );
          break;
      }

      const { data, error } = await query
        .order("count", { ascending: false })
        .limit(10);

      if (error) {
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
