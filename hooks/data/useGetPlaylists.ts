import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/libs/supabase/client";
import { Playlist } from "@/types";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";
import { useUser } from "@/hooks/auth/useUser";

/**
 * ユーザーのプレイリスト一覧を取得するカスタムフック
 * @returns プレイリストの配列
 */
const useGetPlaylists = () => {
  const supabase = createClient();
  const { user } = useUser();

  const queryKey = [CACHED_QUERIES.playlists, user?.id];

  return useQuery({
    queryKey,
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("playlists")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      return (data as Playlist[]) || [];
    },
    enabled: !!user?.id,
    staleTime: CACHE_CONFIG.staleTime,
    gcTime: CACHE_CONFIG.gcTime,
  });
};

export default useGetPlaylists;
