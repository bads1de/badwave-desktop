import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/libs/supabase/client";
import { Playlist } from "@/types";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";
import { useUser } from "@/hooks/auth/useUser";
import { electronAPI } from "@/libs/electron/index";

/**
 * ユーザーのプレイリスト一覧を取得するカスタムフック (ローカルファースト)
 *
 * Electron環境では常にローカルDBから読み込みます。
 * 同期は useSyncPlaylists フックが担当します。
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

      // Electron環境では常にローカルDBから読み込む
      if (electronAPI.isElectron()) {
        const cachedPlaylists = await electronAPI.cache.getCachedPlaylists(
          user.id
        );
        return (cachedPlaylists as Playlist[]) || [];
      }

      // Web版: Supabaseから直接取得
      const { data, error } = await supabase
        .from("playlists")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching playlists:", error.message);
        throw error;
      }

      return (data as Playlist[]) || [];
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
