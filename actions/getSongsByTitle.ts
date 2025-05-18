import { createClient } from "@/libs/supabase/server";
import { Song } from "@/types";

/**
 * タイトルで曲を検索する
 * @param {string} title 検索するタイトル
 * @returns {Promise<{songs: Song[]}>} 通常曲オブジェクト
 */
const getSongsByTitle = async (title: string) => {
  const supabase = await createClient();

  const query = supabase
    .from("songs")
    .select("*")
    .order("created_at", { ascending: false });

  // タイトルが指定されている場合のみフィルタを追加
  if (title) {
    query.ilike("title", `%${title}%`);
  }

  const { data, error } = await query.limit(20); // 必要な数だけ取得

  if (error) {
    console.error("Error fetching songs:", error);
    return { songs: [] };
  }

  return {
    songs: (data as Song[]) || [],
  };
};

export default getSongsByTitle;
