import { Song } from "@/types";
import { useQuery, onlineManager } from "@tanstack/react-query";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";
import { createClient } from "@/libs/supabase/client";
import { isNetworkError, electronAPI } from "@/libs/electron/index";

/**
 * 最新曲を取得するカスタムフック (クライアントサイド)
 *
 * onlineManager により、オフライン時はクエリが自動的に pause されます。
 * PersistQueryClient により、オフライン時や起動時は即座にキャッシュから表示されます。
 *
 * @param {Song[]} initialData - サーバーから取得した初期データ（Optional）
 * @param {number} limit - 取得する曲数の上限
 * @returns {Object} 曲の取得状態と結果
 */
const useGetSongs = (initialData?: Song[], limit: number = 12) => {
  const supabase = createClient();

  const queryKey = [CACHED_QUERIES.songs, limit];

  const {
    data: songs = [],
    isLoading,
    error,
    fetchStatus,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      // Electron環境: ローカルキャッシュから取得
      // Latest Songs (id: home_latest_songs) として取得
      if (electronAPI.isElectron()) {
        const cacheKey = "home_latest_songs";
        const cachedSongs = await electronAPI.cache.getSectionData(
          cacheKey,
          "songs"
        );
        return (cachedSongs as Song[]) || [];
      }

      // オフライン時はフェッチをスキップしてundefinedを返す（キャッシュがあればそれを使用）
      if (!onlineManager.isOnline()) {
        return undefined;
      }

      const { data, error } = await supabase
        .from("songs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        // オフラインまたはネットワークエラーの場合はログのみ
        if (!onlineManager.isOnline() || isNetworkError(error)) {
          console.log("[useGetSongs] Fetch skipped: offline/network error");
          return undefined;
        }
        console.error("Error fetching songs:", error.message);
        throw error;
      }

      return (data as Song[]) || [];
    },
    initialData: initialData,
    staleTime: CACHE_CONFIG.staleTime,
    gcTime: CACHE_CONFIG.gcTime,
    retry: false,
    networkMode: "always",
  });

  const isPaused = fetchStatus === "paused";

  return { songs, isLoading, error, isPaused };
};

export default useGetSongs;
