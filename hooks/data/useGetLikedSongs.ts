import { Song } from "@/types";
import { createClient } from "@/libs/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";
import { electronAPI } from "@/libs/electron-utils";

/**
 * ユーザーがいいねした曲を取得するカスタムフック
 *
 * PersistQueryClient により、オフライン時や起動時は即座にキャッシュから表示されます。
 */
const useGetLikedSongs = (userId?: string) => {
  const supabaseClient = createClient();
  const { isOnline } = useNetworkStatus();

  const queryKey = [CACHED_QUERIES.likedSongs, userId];

  const {
    data: likedSongs = [],
    isLoading,
    error,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!userId) {
        return [];
      }

      // オンラインの場合は Supabase から取得
      const { data, error } = await supabaseClient
        .from("liked_songs_regular")
        .select("*, songs(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching liked songs:", error);
        throw new Error("いいねした曲の取得に失敗しました");
      }

      if (!data) return [];

      const songs = data.map((item) => ({
        ...item.songs,
        songType: "regular" as const,
      })) as Song[];

      // オフラインライブラリ用に SQLite キャッシュを同期（バックグラウンド）
      if (electronAPI.isElectron()) {
        electronAPI.cache.syncLikedSongs(userId, songs).catch((e) => {
          console.error("Failed to sync liked songs with metadata:", e);
        });
      }

      return songs;
    },
    staleTime: CACHE_CONFIG.staleTime,
    gcTime: CACHE_CONFIG.gcTime,
    enabled: !!userId && isOnline,
    retry: false,
  });

  return { likedSongs, isLoading, error };
};

export default useGetLikedSongs;
