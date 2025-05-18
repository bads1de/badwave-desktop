import { createClient } from "@/libs/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { CACHE_CONFIG } from "@/constants";
import { useUser } from "@/hooks/auth/useUser";

/**
 * 曲がプレイリストに含まれているかどうかを確認するカスタムフック
 *
 * @param songId 曲のID
 * @param playlists プレイリストの配列
 * @returns 各プレイリストに曲が含まれているかどうかの状態
 */
const usePlaylistSongStatus = (songId: string, playlists: { id: string }[]) => {
  const supabaseClient = createClient();
  const { user } = useUser();
  const playlistIds = playlists.map((playlist) => playlist.id);

  const {
    data: isInPlaylist = {},
    isLoading,
    error,
  } = useQuery({
    queryKey: ["playlistSongStatus", songId, playlistIds, user?.id],
    queryFn: async () => {
      if (!user?.id || !songId || playlistIds.length === 0) {
        return {};
      }

      const { data, error } = await supabaseClient
        .from("playlist_songs")
        .select("playlist_id")
        .eq("user_id", user.id)
        .eq("song_id", songId)
        .in("playlist_id", playlistIds);

      if (error) {
        console.error("Error fetching playlist song status:", error);
        throw new Error("プレイリスト曲の状態の取得に失敗しました");
      }

      // 結果をプレイリストIDをキーとしたオブジェクトに変換
      const result: Record<string, boolean> = {};
      playlistIds.forEach((id) => {
        result[id] = false;
      });

      // 曲が含まれているプレイリストを設定
      data.forEach((item) => {
        result[item.playlist_id] = true;
      });

      return result;
    },
    staleTime: CACHE_CONFIG.staleTime,
    gcTime: CACHE_CONFIG.gcTime,
    enabled: !!user?.id && !!songId && playlistIds.length > 0,
  });

  return {
    isInPlaylist,
    isLoading,
    error,
  };
};

export default usePlaylistSongStatus;
