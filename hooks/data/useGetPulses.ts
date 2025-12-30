import { Pulse } from "@/types";
import { createClient } from "@/libs/supabase/client";
import { useQuery, onlineManager } from "@tanstack/react-query";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";
import { isNetworkError } from "@/libs/electron/index";

/**
 * Pulseデータを取得するカスタムフック (オフライン対応)
 *
 * onlineManager により、オフライン時はクエリが自動的に pause されます。
 * PersistQueryClient により、オフライン時や起動時は即座にキャッシュから表示されます。
 *
 * @param initialData - サーバーから取得した初期データ（オプション）
 * @returns Pulseのリストとローディング状態
 */
const useGetPulses = (initialData?: Pulse[]) => {
  const supabaseClient = createClient();

  const queryKey = [CACHED_QUERIES.pulse];

  const {
    data: pulses = [],
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

      const { data, error } = await supabaseClient
        .from("pulses")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        if (!onlineManager.isOnline() || isNetworkError(error)) {
          console.log("[useGetPulses] Fetch skipped: offline/network error");
          return undefined;
        }
        console.error("Error fetching pulses:", error);
        throw new Error("Pulseの取得に失敗しました");
      }

      return (data as Pulse[]) || [];
    },
    initialData: initialData,
    staleTime: CACHE_CONFIG.staleTime,
    gcTime: CACHE_CONFIG.gcTime,
    retry: false,
  });

  const isPaused = fetchStatus === "paused";

  return {
    pulses,
    isLoading,
    error,
    isPaused,
  };
};

export default useGetPulses;
