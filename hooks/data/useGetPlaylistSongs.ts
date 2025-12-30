import { Song } from "@/types";
import { createClient } from "@/libs/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";
import { electronAPI } from "@/libs/electron/index";

/**
 * プレイリストの曲を取得するカスタムフック (ローカルファースト)
 *
 * Electron環境では常にローカルDBから読み込みます。
 * 同期は useSyncPlaylistSongs フックが担当します。
 *
 * networkMode: "always" により、オフライン時でも queryFn が実行され、
 * SQLite キャッシュからの取得が可能になります。
 */
const useGetPlaylistSongs = (playlistId?: string) => {
  const supabaseClient = createClient();

  const queryKey = [CACHED_QUERIES.playlists, playlistId, "songs"];

  const {
    data: songs = [],
    isLoading,
    error,
    fetchStatus,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!playlistId) return [];

      // Electron環境では常にローカルDBから読み込む
      if (electronAPI.isElectron()) {
        const cachedSongs = await electronAPI.cache.getCachedPlaylistSongs(
          playlistId
        );
        return (cachedSongs as Song[]) || [];
      }

      // Web版: Supabaseから直接取得
      const { data, error } = await supabaseClient
        .from("playlist_songs")
        .select("*, songs(*)")
        .eq("playlist_id", playlistId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching playlist songs:", error);
        throw new Error("プレイリストの曲の取得に失敗しました");
      }

      if (!data) return [];

      return data.map((item) => ({
        ...item.songs,
        songType: "regular" as const,
      })) as Song[];
    },
    staleTime: CACHE_CONFIG.staleTime,
    gcTime: CACHE_CONFIG.gcTime,
    enabled: !!playlistId,
    retry: false,
    networkMode: "always",
  });

  const isPaused = fetchStatus === "paused";

  return { songs, isLoading, error, isPaused };
};

export default useGetPlaylistSongs;
