import { Playlist } from "@/types";
import { createClient } from "@/libs/supabase/client";
import { useQuery, onlineManager } from "@tanstack/react-query";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";
import { isNetworkError, electronAPI } from "@/libs/electron/index";

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

      // Electron環境: ローカルDB (キャッシュ) から優先的に取得
      if (electronAPI.isElectron()) {
        try {
          const localPlaylist = await electronAPI.cache.getPlaylistById(
            playlistId
          );
          if (localPlaylist) {
            return localPlaylist as Playlist;
          }
        } catch (e) {
          console.error("[useGetPlaylist] Local fetch failed:", e);
        }
        // ローカルにない場合は続行してSupabaseから取得を試みる
      }

      // オフライン時はフェッチをスキップ
      if (!onlineManager.isOnline()) {
        return undefined;
      }

      const { data, error } = await supabaseClient
        .from("playlists")
        .select("*")
        .eq("id", playlistId)
        .single();

      if (error) {
        if (!onlineManager.isOnline() || isNetworkError(error)) {
          console.log("[useGetPlaylist] Fetch skipped: offline/network error");
          return undefined;
        }
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
