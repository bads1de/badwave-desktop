import { Song } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { CACHED_QUERIES } from "@/constants";
import { useOfflineCheck } from "@/hooks/utils/useOfflineCheck";
import { createClient } from "@/libs/supabase/client";
import { useEffect, useRef } from "react";
import dayjs from "dayjs";

/**
 * トレンド曲を取得するカスタムフック
 *
 * オフライン時はローカルスキーマがないため、空配列を返します。
 */
const useGetTrendSongs = (
  period: "all" | "month" | "week" | "day" = "all",
  initialData?: Song[]
) => {
  const supabase = createClient();
  const { isOnline, checkOffline } = useOfflineCheck();

  const queryKey = [CACHED_QUERIES.trendSongs, period];

  const {
    data: trends = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      // 念のため実行時にもチェック
      const isCurrentlyOffline = await checkOffline();
      // オフライン時は何も取得しない
      if (isCurrentlyOffline) {
        return [];
      }

      // オンラインの場合はSupabaseから取得
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
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24,
    retry: isOnline ? 1 : false,
  });

  const prevIsOnline = useRef(isOnline);

  useEffect(() => {
    if (!prevIsOnline.current && isOnline) {
      refetch();
    }
    prevIsOnline.current = isOnline;
  }, [isOnline, refetch]);

  return { trends, isLoading, error };
};

export default useGetTrendSongs;
