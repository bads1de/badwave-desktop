import { Playlist } from "@/types";
import { createClient } from "@/libs/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";

/**
 * プレイリスト情報を取得するカスタムフック
 *
 * @param playlistId プレイリストID
 * @returns プレイリスト情報とローディング状態
 */
const useGetPlaylist = (playlistId?: string) => {
  const supabaseClient = createClient();

  const {
    data: playlist,
    isLoading,
    error,
  } = useQuery({
    queryKey: [CACHED_QUERIES.playlists, playlistId],
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
  });

  return {
    playlist,
    isLoading,
    error,
  };
};

export default useGetPlaylist;
