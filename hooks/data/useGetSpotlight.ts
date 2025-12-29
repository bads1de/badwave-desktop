import { Spotlight } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";
import { createClient } from "@/libs/supabase/client";

/**
 * スポットライトデータを取得するカスタムフック (クライアントサイド)
 *
 * PersistQueryClient により、オフライン時や起動時は即座にキャッシュから表示されます。
 */
const useGetSpotlight = (initialData?: Spotlight[]) => {
  const { isOnline } = useNetworkStatus();
  const supabase = createClient();

  const queryKey = [CACHED_QUERIES.spotlight];

  const {
    data: spotlightData = [],
    isLoading,
    error,
  } = useQuery({
    queryKey,
    queryFn: async () => {
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
    enabled: isOnline,
    retry: false,
  });

  return { spotlightData, isLoading, error };
};

export default useGetSpotlight;
