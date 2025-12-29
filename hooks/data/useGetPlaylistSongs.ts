import { Song } from "@/types";
import { createClient } from "@/libs/supabase/client";
import { useQuery, onlineManager } from "@tanstack/react-query";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";
import { electronAPI } from "@/libs/electron-utils";

/**
 * プレイリストの曲を取得するカスタムフック
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

      // Electron環境かつオフラインの場合はSQLiteキャッシュから取得
      if (electronAPI.isElectron() && !onlineManager.isOnline()) {
        const cachedSongs = await electronAPI.cache.getCachedPlaylistSongs(
          playlistId
        );
        if (cachedSongs && cachedSongs.length > 0) {
          return cachedSongs as Song[];
        }
      }

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

      const mappedSongs = data.map((item) => ({
        ...item.songs,
        songType: "regular" as const,
      })) as Song[];

      // オフラインライブラリ用に SQLite キャッシュを同期（バックグラウンド）
      if (electronAPI.isElectron()) {
        electronAPI.cache
          .syncPlaylistSongs({ playlistId, songs: mappedSongs })
          .catch((e) => {
            console.error("Failed to sync playlist songs with metadata:", e);
          });
      }

      return mappedSongs;
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
