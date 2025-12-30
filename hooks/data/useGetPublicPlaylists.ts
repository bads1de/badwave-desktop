import { Playlist } from "@/types";
import { useQuery, onlineManager } from "@tanstack/react-query";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";
import { createClient } from "@/libs/supabase/client";
import { isNetworkError } from "@/libs/electron-utils";

/**
 * パブリックプレイリストを取得するカスタムフック (クライアントサイド)
 *
 * onlineManager により、オフライン時はクエリが自動的に pause されます。
 * PersistQueryClient により、オフライン時や起動時は即座にキャッシュから表示されます。
 *
 * @param {Playlist[]} initialData - サーバーから取得した初期データ（Optional）
 * @param {number} limit - 取得するプレイリスト数の上限
 * @returns {Object} パブリックプレイリストの取得状態と結果
 */
const useGetPublicPlaylists = (initialData?: Playlist[], limit: number = 6) => {
  const supabase = createClient();

  const queryKey = [CACHED_QUERIES.publicPlaylists, limit];

  const {
    data: playlists = [],
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

      const { data, error } = await supabase
        .from("playlists")
        .select("*")
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        if (!onlineManager.isOnline() || isNetworkError(error)) {
          console.log(
            "[useGetPublicPlaylists] Fetch skipped: offline/network error"
          );
          return undefined;
        }
        console.error("Error fetching public playlists:", error.message);
        throw error;
      }

      return (data as Playlist[]) || [];
    },
    initialData: initialData,
    staleTime: CACHE_CONFIG.staleTime,
    gcTime: CACHE_CONFIG.gcTime,
    retry: false,
  });

  const isPaused = fetchStatus === "paused";

  return { playlists, isLoading, error, isPaused };
};

export default useGetPublicPlaylists;
