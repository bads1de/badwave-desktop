import { Spotlight } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";
import { createClient } from "@/libs/supabase/client";

/**
 * スポットライトデータを取得するカスタムフック (クライアントサイド)
 *
 * onlineManager により、オフライン時はクエリが自動的に pause されます。
 * PersistQueryClient により、オフライン時や起動時は即座にキャッシュから表示されます。
 */
const useGetSpotlight = (initialData?: Spotlight[]) => {
  const supabase = createClient();

  const queryKey = [CACHED_QUERIES.spotlight];

  const {
    data: spotlightData = [],
    isLoading,
    error,
    fetchStatus,
  } = useQuery({
    queryKey,
    queryFn: async () => {
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
    retry: false,
  });

  const isPaused = fetchStatus === "paused";

  return { spotlightData, isLoading, error, isPaused };
};

export default useGetSpotlight;
