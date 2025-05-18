import { createClient } from "@/libs/supabase/server";
import { Song } from "@/types";

/**
 * 全ての曲を取得する
 * @returns {Promise<Song[]>} 曲の配列
 */
const getSongs = async (): Promise<Song[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("songs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(12);

  if (error) {
    console.log("Error fetching songs:", error.message);
    return [];
  }

  return (data as Song[]) || [];
};

export default getSongs;
