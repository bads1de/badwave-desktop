import { createClient } from "@/libs/supabase/client";
import { useQuery, onlineManager } from "@tanstack/react-query";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";
import { isNetworkError } from "@/libs/electron-utils";

/**
 * 曲のいいね状態を取得するカスタムフック
 *
 * @param songId 曲のID
 * @param userId ユーザーID
 * @returns いいね状態とローディング状態
 */
const useLikeStatus = (songId: string, userId?: string) => {
  const supabaseClient = createClient();
  const { isOnline } = useNetworkStatus();

  const {
    data: isLiked = false,
    isLoading,
    error,
  } = useQuery({
    queryKey: [CACHED_QUERIES.likeStatus, songId, userId],
    queryFn: async () => {
      if (!userId) {
        return false;
      }

      const { data, error } = await supabaseClient
        .from("liked_songs_regular")
        .select("*")
        .eq("user_id", userId)
        .eq("song_id", songId)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        // オフラインまたはネットワークエラーの場合はfalseを返す
        if (!onlineManager.isOnline() || isNetworkError(error)) {
          console.log("[useLikeStatus] Fetch skipped: offline/network error");
          return undefined; // キャッシュがあればそれを使用
        }
        console.error("Error fetching like status:", error);
        throw new Error("いいねの状態の取得に失敗しました");
      }

      return !!data;
    },
    staleTime: CACHE_CONFIG.staleTime,
    gcTime: CACHE_CONFIG.gcTime,
    // オフライン時はフェッチをスキップ
    enabled:
      isOnline &&
      !!userId &&
      !(typeof songId === "string" && songId.startsWith("local_")),
  });

  return {
    isLiked,
    isLoading,
    error,
  };
};

export default useLikeStatus;
