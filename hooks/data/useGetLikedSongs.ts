import { Song } from "@/types";
import { createClient } from "@/libs/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";

/**
 * ユーザーがいいねした曲を取得するカスタムフック
 *
 * @param userId ユーザーID
 * @returns いいねした曲のリストとローディング状態
 */
const useGetLikedSongs = (userId?: string) => {
  const supabaseClient = createClient();

  const {
    data: likedSongs = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: [CACHED_QUERIES.likedSongs, userId],
    queryFn: async () => {
      if (!userId) {
        return [];
      }

      const { data, error } = await supabaseClient
        .from("liked_songs_regular")
        .select("*, songs(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching liked songs:", error);
        throw new Error("いいねした曲の取得に失敗しました");
      }

      // データがなければ空の配列を返す
      if (!data) {
        return [];
      }

      // 取得したデータから曲の情報のみを新しい配列にして返す
      return data.map((item) => ({
        ...item.songs,
        songType: "regular" as const,
      }));
    },
    staleTime: CACHE_CONFIG.staleTime,
    gcTime: CACHE_CONFIG.gcTime,
    enabled: !!userId,
  });

  return {
    likedSongs,
    isLoading,
    error,
  };
};

export default useGetLikedSongs;
