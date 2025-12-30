import { Spotlight } from "@/types";
import { useQuery, onlineManager } from "@tanstack/react-query";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";
import { createClient } from "@/libs/supabase/client";
import { isNetworkError, electronAPI } from "@/libs/electron/index";

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
      // Electron環境: ローカルキャッシュから取得
      if (electronAPI.isElectron()) {
        const cacheKey = "home_spotlight";
        const cachedSpots = await electronAPI.cache.getSectionData(
          cacheKey,
          "spotlights"
        );
        return (cachedSpots as Spotlight[]) || [];
      }

      // オフライン時はフェッチをスキップ
      if (!onlineManager.isOnline()) {
        return undefined;
      }

      const { data, error } = await supabase
        .from("spotlights")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        if (!onlineManager.isOnline() || isNetworkError(error)) {
          console.log("[useGetSpotlight] Fetch skipped: offline/network error");
          return undefined;
        }
        console.error("Error fetching spotlights:", error.message);
        throw error;
      }

      return (data as Spotlight[]) || [];
    },
    initialData: initialData,
    staleTime: CACHE_CONFIG.staleTime,
    gcTime: CACHE_CONFIG.gcTime,
    retry: false,
    networkMode: "always",
  });

  const isPaused = fetchStatus === "paused";

  return { spotlightData, isLoading, error, isPaused };
};

export default useGetSpotlight;
