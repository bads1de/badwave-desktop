import { Song } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { CACHED_QUERIES } from "@/constants";
import getTrendSongs from "@/actions/getTrendSongs";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";
import { useOfflineCache } from "@/hooks/utils/useOfflineCache";
import { useEffect } from "react";

/**
 * 指定された期間に基づいてトレンド曲を取得するカスタムフック
 *
 * @param {"all" | "month" | "week" | "day"} period - 取得する期間
 * @param {Song[]} initialData - サーバーから取得した初期データ
 * @returns {Object} トレンド曲の取得状態と結果
 */
const useGetTrendSongs = (
  period: "all" | "month" | "week" | "day" = "all",
  initialData?: Song[]
) => {
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

      // オンラインの場合は通常通りAPIから取得
      const data = await getTrendSongs(period);

      // バックグラウンドでキャッシュに保存
      saveToCache(queryKey.join(":"), data).catch(console.error);

      return data;
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
