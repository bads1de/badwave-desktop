"use client";

import { Pulse } from "@/types";
import { createClient } from "@/libs/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";
import { useOfflineCheck } from "@/hooks/utils/useOfflineCheck";
import { useOfflineCache } from "@/hooks/utils/useOfflineCache";
import { useEffect, useRef } from "react";

/**
 * Pulseデータを取得するカスタムフック (オフライン対応)
 *
 * @param initialData - サーバーから取得した初期データ（オプション）
 * @returns Pulseのリストとローディング状態
 */
const useGetPulses = (initialData?: Pulse[]) => {
  const supabaseClient = createClient();
  const { isOnline, checkOffline } = useOfflineCheck();
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
      const isCurrentlyOffline = await checkOffline();
      // オフラインの場合はキャッシュから取得を試みる
      if (isCurrentlyOffline) {
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

  const prevIsOnline = useRef(isOnline);

  // オンラインに戻ったときに再取得
  useEffect(() => {
    if (!prevIsOnline.current && isOnline) {
      refetch();
    }
    prevIsOnline.current = isOnline;
  }, [isOnline, refetch]);

  return {
    pulses,
    isLoading,
    error,
  };
};

export default useGetPulses;
