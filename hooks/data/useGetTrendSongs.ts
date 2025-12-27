import { Song } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { CACHED_QUERIES } from "@/constants";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";
import { useOfflineCache } from "@/hooks/utils/useOfflineCache";
import { createClient } from "@/libs/supabase/client";
import { useEffect } from "react";
import dayjs from "dayjs";

/**
 * 指定された期間に基づいてトレンド曲を取得するカスタムフック (クライアントサイド)
 *
 * @param {"all" | "month" | "week" | "day"} period - 取得する期間
 * @param {Song[]} initialData - サーバーから取得した初期データ
 * @returns {Object} トレンド曲の取得状態と結果
 */
const useGetTrendSongs = (
  period: "all" | "month" | "week" | "day" = "all",
  initialData?: Song[]
) => {
  const supabase = createClient();
  const { isOnline } = useNetworkStatus();
  const { saveToCache, loadFromCache } = useOfflineCache();

  const queryKey = [CACHED_QUERIES.trendSongs, period];

  const {
    data: trends = [],
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

      // オンラインの場合はSupabaseから直接取得
      let query = supabase.from("songs").select("*");

      // 指定された期間に基づいてデータをフィルタリング
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
        default:
          break;
      }

      // データを取得し、カウントの降順でソートし、最大10曲まで取得
      const { data, error } = await query
        .order("count", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error fetching trend songs:", error.message);
        throw error;
      }

      const result = (data as Song[]) || [];

      // バックグラウンドでキャッシュに保存
      saveToCache(queryKey.join(":"), result).catch(console.error);

      return result;
    },
    initialData: initialData,
    staleTime: 1000 * 60 * 60 * 24, // 1日間
    gcTime: 1000 * 60 * 60 * 24, // 1日間
    retry: isOnline ? 1 : false,
  });

  // オンラインに戻ったときに再取得
  useEffect(() => {
    if (isOnline) {
      refetch();
    }
  }, [isOnline, refetch]);

  if (error && isOnline) {
    console.error("トレンドデータの取得に失敗しました。", error);
  }

  return { trends, isLoading, error };
};

export default useGetTrendSongs;
