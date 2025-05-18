import { Song } from "@/types";
import { createClient } from "@/libs/supabase/server";

type SongType = "regular";

/**
 * 現在のユーザーが「いいね」した曲一覧を取得する
 * @param {'regular'} [songType='regular'] - 曲のタイプ
 * @returns {Promise<Song[]>} いいねした曲の配列
 */
const getLikedSongs = async (
  songType: SongType = "regular"
): Promise<Song[]> => {
  // supabaseクライアントを初期化
  const supabase = await createClient();

  // 現在のユーザーセッションを取得
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return [];
  }

  // いいねされた曲を取得
  const { data, error } = await supabase
    .from("liked_songs_regular")
    .select("*, songs(*)") // 関連する曲の情報も含めて取得
    .eq("user_id", user?.id) // ユーザーIDで絞り込み
    .order("created_at", { ascending: false }); // 作成日時で降順ソート

  if (error) {
    console.error("Error fetching liked songs:", error);
    return [];
  }

  // データがなければ空の配列を返す
  if (!data) return [];

  // 取得したデータから曲の情報のみを新しい配列にして返す
  return data.map((item) => ({
    ...item.songs,
    songType,
  }));
};

export default getLikedSongs;
