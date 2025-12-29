import { Playlist } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";
import { createClient } from "@/libs/supabase/client";

/**
 * パブリックプレイリストを取得するカスタムフック (クライアントサイド)
 *
 * PersistQueryClient により、オフライン時や起動時は即座にキャッシュから表示されます。
 *
 * @param {Playlist[]} initialData - サーバーから取得した初期データ（Optional）
 * @param {number} limit - 取得するプレイリスト数の上限
 * @returns {Object} パブリックプレイリストの取得状態と結果
 */
const useGetPublicPlaylists = (initialData?: Playlist[], limit: number = 6) => {
  const { isOnline } = useNetworkStatus();
  const supabase = createClient();

  const queryKey = [CACHED_QUERIES.publicPlaylists, limit];

  const {
    data: playlists = [],
    isLoading,
    error,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      // オンラインの場合はSupabaseから取得
      const { data, error } = await supabase
        .from("playlists")
        .select("*")
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Error fetching public playlists:", error.message);
        throw error;
      }

      return (data as Playlist[]) || [];
    },
    initialData: initialData,
    staleTime: CACHE_CONFIG.staleTime,
    gcTime: CACHE_CONFIG.gcTime,
    enabled: isOnline,
    retry: false,
  });

  return { playlists, isLoading, error };
};

export default useGetPublicPlaylists;
