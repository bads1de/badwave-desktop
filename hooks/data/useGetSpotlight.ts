import { Spotlight } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";
import { createClient } from "@/libs/supabase/client";
import { useEffect, useRef } from "react";

/**
 * スポットライトデータを取得するカスタムフック (クライアントサイド)
 *
 * オフライン時は通信を行わず空を返します（スポットライトは現状オフライン非対応）
 */
const useGetSpotlight = (initialData?: Spotlight[]) => {
  const { isOnline } = useNetworkStatus();
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
      // オフラインの場合は通信しない
      if (!isOnline) {
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

      return (data as Spotlight[]) || [];
    },
    initialData: initialData,
    staleTime: CACHE_CONFIG.staleTime,
    gcTime: CACHE_CONFIG.gcTime,
    enabled: true,
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

  return { spotlightData, isLoading, error };
};

export default useGetSpotlight;
