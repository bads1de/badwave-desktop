import { createClient } from "@/libs/supabase/server";
import { Song } from "@/types";

/**
 * 指定したジャンルの曲一覧を取得する
 * @param {string | string[]} genre - ジャンル名またはジャンル名の配列
 * @returns {Promise<Song[]>} 曲の配列
 */
const getSongsByGenre = async (genre: string | string[]): Promise<Song[]> => {
  // ジャンルが文字列の場合は、カンマで分割して配列に変換
  const genreArray =
    typeof genre === "string" ? genre.split(",").map((g) => g.trim()) : genre;

  const supabase = await createClient();

  // データベースから曲を検索
  const { data, error } = await supabase
    .from("songs")
    .select("*")
    .or(genreArray.map((genre) => `genre.ilike.%${genre}%`).join(","))
    .order("created_at", { ascending: false });

  if (error) {
    console.log("Error fetching songs by genre:", error.message);
    return [];
  }

  return (data as Song[]) || [];
};

export default getSongsByGenre;
