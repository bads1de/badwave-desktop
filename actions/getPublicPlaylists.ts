import { createClient } from "@/libs/supabase/server";
import { Playlist } from "@/types";

/**
 * パブリックプレイリスト一覧を取得する
 * @returns {Promise<Playlist[]>} プレイリストの配列
 */
const getPublicPlaylists = async (limit: number = 6): Promise<Playlist[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("playlists")
    .select("*")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.log("Error fetching public playlists:", error.message);
    return [];
  }

  return (data as Playlist[]) || [];
};

export default getPublicPlaylists;
