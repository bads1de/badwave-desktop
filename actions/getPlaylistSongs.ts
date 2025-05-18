import { Song } from "@/types";
import { createClient } from "@/libs/supabase/server";

type PlaylistSong = Song & { songType: "regular" };

/**
 * 指定されたプレイリストIDに含まれる曲を取得する
 * @param {string} playlistId プレイリストID
 * @returns {Promise<PlaylistSong[]>} プレイリストに含まれる曲の配列
 */
const getPlaylistSongs = async (
  playlistId: string
): Promise<PlaylistSong[]> => {
  const supabase = await createClient();

  // まずプレイリストの情報を取得して public かどうかを確認
  const { data: playlist, error: playlistError } = await supabase
    .from("playlists")
    .select("is_public, user_id")
    .eq("id", playlistId)
    .single();

  if (playlistError) {
    console.error("Error fetching playlist:", playlistError);
    return [];
  }

  // 現在のユーザー情報を取得
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // プレイリストが非公開で、ユーザーが未ログインまたはプレイリストの所有者でない場合
  if (!playlist.is_public && (!user?.id || user.id !== playlist.user_id)) {
    return [];
  }

  const { data, error } = await supabase
    .from("playlist_songs")
    .select("*, songs(*)")
    .eq("playlist_id", playlistId)
    .eq("song_type", "regular")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching playlist songs:", error);
    return [];
  }

  return (data || []).map((item) => ({
    ...item.songs,
    songType: "regular",
  }));
};

export default getPlaylistSongs;
