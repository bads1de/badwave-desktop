import { Playlist } from "@/types";
import { createClient } from "@/libs/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";

/**
 * プレイリスト情報を取得するカスタムフック
 *
 * onlineManager により、オフライン時はクエリが自動的に pause されます。
 * PersistQueryClient により、オフライン時や起動時は即座にキャッシュから表示されます。
 */
const useGetPlaylist = (playlistId?: string) => {
  const supabaseClient = createClient();

  const queryKey = [CACHED_QUERIES.playlists, playlistId];

  const {
    data: playlist,
    isLoading,
    error,
    fetchStatus,
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
    enabled: !!playlistId,
    retry: false,
  });

  const isPaused = fetchStatus === "paused";

  return {
    playlist,
    isLoading,
    error,
    isPaused,
  };
};

export default useGetPlaylist;
