import { Spotlight } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";
import { useOfflineCache } from "@/hooks/utils/useOfflineCache";
import { createClient } from "@/libs/supabase/client";
import { useEffect } from "react";

/**
 * スポットライトデータを取得するカスタムフック (クライアントサイド)
 *
 * @param {Spotlight[]} initialData - サーバーから取得した初期データ（Optional）
 * @returns {Object} スポットライトの取得状態と結果
 */
const useGetSpotlight = (initialData?: Spotlight[]) => {
  const { isOnline } = useNetworkStatus();
  const { saveToCache, loadFromCache } = useOfflineCache();
  const supabase = createClient();

  const queryKey = [CACHED_QUERIES.spotlight];

  const {
    data: spotlightData = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      // オフラインの場合はキャッシュから取得を試みる
      if (!isOnline) {
        const cachedData = await loadFromCache<Spotlight[]>(queryKey.join(":"));
        if (cachedData) return cachedData;
        return [];
      }

      // オンラインの場合はSupabaseから取得
      const { data, error } = await supabase
        .from("spotlights")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching spotlights:", error.message);
        throw error;
      }

      const result = (data as Spotlight[]) || [];

      // バックグラウンドでキャッシュに保存
      saveToCache(queryKey.join(":"), result).catch(console.error);

      return result;
    },
    initialData: initialData,
    staleTime: CACHE_CONFIG.staleTime,
    gcTime: CACHE_CONFIG.gcTime,
    retry: isOnline ? 1 : false,
  });

  // オンラインに戻ったときに再取得
  useEffect(() => {
    if (isOnline) {
      refetch();
    }
  }, [isOnline, refetch]);

  return { spotlightData, isLoading, error };
};

export default useGetSpotlight;
