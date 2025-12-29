import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/libs/supabase/client";
import { Playlist } from "@/types";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";

/**
 * タイトルでパブリックプレイリストを検索するカスタムフック (オフライン対応)
 *
 * PersistQueryClient により、オフライン時や起動時は即座にキャッシュから表示されます。
 *
 * @param title 検索するタイトル
 * @returns プレイリストの配列とローディング状態
 */
const useGetPlaylistsByTitle = (title: string) => {
  const supabase = createClient();
  const { isOnline } = useNetworkStatus();

  const queryKey = [CACHED_QUERIES.playlists, "search", title];

  const {
    data: playlists = [],
    isLoading,
    error,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      // タイトルが空の場合は空の配列を返す
      if (!title) {
        return [];
      }

      const { data, error } = await supabase
        .from("playlists")
        .select("*")
        .eq("is_public", true)
        .ilike("title", `%${title}%`)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching playlists by title:", error.message);
        throw error;
      }

      return (data as Playlist[]) || [];
    },
    enabled: !!title && isOnline,
    staleTime: CACHE_CONFIG.staleTime,
    gcTime: CACHE_CONFIG.gcTime,
    retry: false,
  });

  return { playlists, isLoading, error };
};

export default useGetPlaylistsByTitle;
