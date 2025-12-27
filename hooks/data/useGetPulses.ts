"use client";

import { Pulse } from "@/types";
import { createClient } from "@/libs/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";
import { useOfflineCache } from "@/hooks/utils/useOfflineCache";
import { useEffect } from "react";

/**
 * Pulseデータを取得するカスタムフック (オフライン対応)
 *
 * @param initialData - サーバーから取得した初期データ（オプション）
 * @returns Pulseのリストとローディング状態
 */
const useGetPulses = (initialData?: Pulse[]) => {
  const supabaseClient = createClient();
  const { isOnline } = useNetworkStatus();
  const { saveToCache, loadFromCache } = useOfflineCache();

  const queryKey = [CACHED_QUERIES.pulse];

  const {
    data: pulses = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      // オフラインの場合はキャッシュから取得を試みる
      if (!isOnline) {
        const cachedData = await loadFromCache<Pulse[]>(queryKey.join(":"));
        if (cachedData) return cachedData;
        return [];
      }

      const { data, error } = await supabaseClient
        .from("pulses")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching pulses:", error);
        throw new Error("Pulseの取得に失敗しました");
      }

      const result = (data as Pulse[]) || [];

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

  return {
    pulses,
    isLoading,
    error,
  };
};

export default useGetPulses;
