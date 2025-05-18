import { createClient } from "@/libs/supabase/server";
import { Playlist } from "@/types";

/**
 * ユーザーのプレイリスト一覧を取得する
 * @returns {Promise<Playlist[]>} プレイリストの配列
 */
const getPlaylists = async (): Promise<Playlist[]> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return [];
  }

  const { data, error } = await supabase
    .from("playlists")
    .select("*")
    .eq("user_id", user?.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(`Failed to fetch playlists: ${error.message}`);
    return [];
  }

  return (data as Playlist[]) || [];
};

export default getPlaylists;
