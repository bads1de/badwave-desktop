import { Playlist } from "@/types";
import { createClient } from "@/libs/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";

/**
 * プレイリスト情報を取得するカスタムフック
 *
 * PersistQueryClient により、オフライン時や起動時は即座にキャッシュから表示されます。
 */
const useGetPlaylist = (playlistId?: string) => {
  const supabaseClient = createClient();
  const { isOnline } = useNetworkStatus();

  const queryKey = [CACHED_QUERIES.playlists, playlistId];

  const {
    data: playlist,
    isLoading,
    error,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!playlistId) {
        return null;
      }

      const { data, error } = await supabaseClient
        .from("playlists")
        .select("*")
        .eq("id", playlistId)
        .single();

      if (error) {
        console.error("Error fetching playlist:", error);
        throw new Error("プレイリストの取得に失敗しました");
      }

      return data as Playlist;
    },
    staleTime: CACHE_CONFIG.staleTime,
    gcTime: CACHE_CONFIG.gcTime,
    enabled: !!playlistId && isOnline,
    retry: false,
  });

  return {
    playlist,
    isLoading,
    error,
  };
};

export default useGetPlaylist;
