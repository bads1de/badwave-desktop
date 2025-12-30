import { useQuery, onlineManager } from "@tanstack/react-query";
import { createClient } from "@/libs/supabase/client";
import { Playlist } from "@/types";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";
import { isNetworkError } from "@/libs/electron-utils";

/**
 * タイトルでパブリックプレイリストを検索するカスタムフック (オフライン対応)
 *
 * onlineManager により、オフライン時はクエリが自動的に pause されます。
 * PersistQueryClient により、オフライン時や起動時は即座にキャッシュから表示されます。
 *
 * @param title 検索するタイトル
 * @returns プレイリストの配列とローディング状態
 */
const useGetPlaylistsByTitle = (title: string) => {
  const supabase = createClient();

  const queryKey = [CACHED_QUERIES.playlists, "search", title];

  const {
    data: playlists = [],
    isLoading,
    error,
    fetchStatus,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      // タイトルが空の場合は空の配列を返す
      if (!title) {
        return [];
      }

      // オフライン時はフェッチをスキップ
      if (!onlineManager.isOnline()) {
        return undefined;
      }

      const { data, error } = await supabase
        .from("playlists")
        .select("*")
        .eq("is_public", true)
        .ilike("title", `%${title}%`)
        .order("created_at", { ascending: false });

      if (error) {
        // ネットワークエラーまたはオフラインの場合はエラーをスローしない
        if (!onlineManager.isOnline() || isNetworkError(error)) {
          console.log(
            "[useGetPlaylistsByTitle] Network error, returning cached data"
          );
          return undefined;
        }
        console.error("Error fetching playlists by title:", error.message);
        throw error;
      }

      return (data as Playlist[]) || [];
    },
    enabled: !!title,
    staleTime: CACHE_CONFIG.staleTime,
    gcTime: CACHE_CONFIG.gcTime,
    retry: false,
  });

  const isPaused = fetchStatus === "paused";

  return { playlists, isLoading, error, isPaused };
};

export default useGetPlaylistsByTitle;
