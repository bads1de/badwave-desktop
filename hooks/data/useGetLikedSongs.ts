import { Song } from "@/types";
import { createClient } from "@/libs/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";
import { electronAPI } from "@/libs/electron/index";

/**
 * ユーザーがいいねした曲を取得するカスタムフック (ローカルファースト)
 *
 * Electron環境では常にローカルDBから読み込みます。
 * 同期は useSyncLikedSongs フックが担当します。
 *
 * networkMode: "always" により、オフライン時でも queryFn が実行され、
 * SQLite キャッシュからの取得が可能になります。
 */
const useGetLikedSongs = (userId?: string) => {
  const supabaseClient = createClient();

  const queryKey = [CACHED_QUERIES.likedSongs, userId];

  const {
    data: likedSongs = [],
    isLoading,
    error,
    fetchStatus,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!userId) {
        return [];
      }

      // Electron環境では常にローカルDBから読み込む
      if (electronAPI.isElectron()) {
        const cachedSongs = await electronAPI.cache.getCachedLikedSongs(userId);
        return (cachedSongs as Song[]) || [];
      }

      // Web版: Supabaseから直接取得
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

      return data.map((item) => ({
        ...item.songs,
        songType: "regular" as const,
      })) as Song[];
    },
    staleTime: CACHE_CONFIG.staleTime,
    gcTime: CACHE_CONFIG.gcTime,
    enabled: !!userId,
    retry: false,
    networkMode: "always", // オフライン時も queryFn を実行するために必要
  });

  const isPaused = fetchStatus === "paused";

  return { likedSongs, isLoading, error, isPaused };
};

export default useGetLikedSongs;
