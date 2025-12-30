import { useQuery, onlineManager } from "@tanstack/react-query";
import { createClient } from "@/libs/supabase/client";
import { Playlist } from "@/types";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";
import { useUser } from "@/hooks/auth/useUser";
import { electronAPI, isNetworkError } from "@/libs/electron-utils";

/**
 * ユーザーのプレイリスト一覧を取得するカスタムフック
 *
 * networkMode: "always" により、オフライン時でも queryFn が実行され、
 * SQLite キャッシュからの取得が可能になります。
 */
const useGetPlaylists = () => {
  const supabase = createClient();
  const { user } = useUser();

  const queryKey = [CACHED_QUERIES.playlists, "user", user?.id];

  const {
    data: playlists = [],
    isLoading,
    error,
    fetchStatus,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user?.id) return [];

      const isOnline = onlineManager.isOnline();

      // Electron環境かつオフラインの場合はSQLiteキャッシュから取得
      if (electronAPI.isElectron() && !isOnline) {
        const cachedPlaylists = await electronAPI.cache.getCachedPlaylists(
          user.id
        );
        // オフライン時はキャッシュを返す（空でも返す）
        return (cachedPlaylists as Playlist[]) || [];
      }

      const { data, error } = await supabase
        .from("playlists")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        // リクエスト中にオフラインになった場合、またはネットワークエラーの場合はキャッシュにフォールバック
        if (!onlineManager.isOnline() || isNetworkError(error)) {
          console.log(
            "[useGetPlaylists] Request failed due to offline/network error, falling back to cache"
          );
          if (electronAPI.isElectron()) {
            const cachedPlaylists = await electronAPI.cache.getCachedPlaylists(
              user.id
            );
            return (cachedPlaylists as Playlist[]) || [];
          }
          return undefined; // キャッシュがあればそれを使用
        }
        console.error("Error fetching playlists:", error.message);
        throw error;
      }

      const result = (data as Playlist[]) || [];

      // オフラインライブラリ用に SQLite キャッシュを同期（バックグラウンド）
      if (electronAPI.isElectron()) {
        electronAPI.cache.syncPlaylists(result).catch((e) => {
          console.error("Failed to sync playlists to cache:", e);
        });
      }

      return result;
    },
    enabled: !!user?.id,
    staleTime: CACHE_CONFIG.staleTime,
    gcTime: CACHE_CONFIG.gcTime,
    retry: false,
    networkMode: "always",
  });

  const isPaused = fetchStatus === "paused";

  return { playlists, isLoading, error, isPaused };
};

export default useGetPlaylists;
