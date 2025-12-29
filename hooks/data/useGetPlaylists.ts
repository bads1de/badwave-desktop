import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/libs/supabase/client";
import { Playlist } from "@/types";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";
import { useUser } from "@/hooks/auth/useUser";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";
import { electronAPI } from "@/libs/electron-utils";

/**
 * ユーザーのプレイリスト一覧を取得するカスタムフック
 *
 * PersistQueryClient により、オフライン時や起動時は即座にキャッシュから表示されます。
 */
const useGetPlaylists = () => {
  const supabase = createClient();
  const { user } = useUser();
  const { isOnline } = useNetworkStatus();

  const queryKey = [CACHED_QUERIES.playlists, "user", user?.id];

  const {
    data: playlists = [],
    isLoading,
    error,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user?.id) return [];

      // オンラインの場合は Supabase から取得
      const { data, error } = await supabase
        .from("playlists")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
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
    enabled: !!user?.id && isOnline,
    staleTime: CACHE_CONFIG.staleTime,
    gcTime: CACHE_CONFIG.gcTime,
    retry: false,
  });

  return { playlists, isLoading, error };
};

export default useGetPlaylists;
