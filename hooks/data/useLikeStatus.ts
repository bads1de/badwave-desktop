import { createClient } from "@/libs/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";

/**
 * 曲のいいね状態を取得するカスタムフック
 *
 * @param songId 曲のID
 * @param userId ユーザーID
 * @returns いいね状態とローディング状態
 */
const useLikeStatus = (songId: string, userId?: string) => {
  const supabaseClient = createClient();

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
        console.error("Error fetching like status:", error);
        throw new Error("いいねの状態の取得に失敗しました");
      }

      return !!data;
    },
    staleTime: CACHE_CONFIG.staleTime,
    gcTime: CACHE_CONFIG.gcTime,
    enabled: !!userId,
  });

  return {
    isLiked,
    isLoading,
    error,
  };
};

export default useLikeStatus;
