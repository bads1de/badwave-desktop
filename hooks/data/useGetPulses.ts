"use client";

import { Pulse } from "@/types";
import { createClient } from "@/libs/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";

/**
 * Pulseデータを取得するカスタムフック
 *
 * @param initialData - サーバーから取得した初期データ（オプション）
 * @returns Pulseのリストとローディング状態
 */
const useGetPulses = (initialData: Pulse[] = []) => {
  const supabaseClient = createClient();

  const {
    data: pulses = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: [CACHED_QUERIES.pulse],
    queryFn: async () => {
      const { data, error } = await supabaseClient
        .from("pulses")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching pulses:", error);
        throw new Error("Pulseの取得に失敗しました");
      }

      return (data as Pulse[]) || [];
    },
    initialData: initialData.length > 0 ? initialData : undefined,
    staleTime: CACHE_CONFIG.staleTime,
    gcTime: CACHE_CONFIG.gcTime,
    // 初期データがある場合は再取得しない
    enabled: initialData.length === 0,
  });

  return {
    pulses,
    isLoading,
    error,
  };
};

export default useGetPulses;
