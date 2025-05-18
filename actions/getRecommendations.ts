import { SongWithRecommendation } from "@/types";
import { createClient } from "@/libs/supabase/server";

/**
 * 現在のユーザーに対する推薦曲を取得する
 * @param {number} [limit=10] - 取得する曲数の上限
 * @returns {Promise<SongWithRecommendation[]>} 推薦曲の配列
 */
const getRecommendations = async (
  limit: number = 10
): Promise<SongWithRecommendation[]> => {
  // supabaseクライアントを初期化
  const supabase = await createClient();

  // 現在のユーザーセッションを取得
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return [];
  }

  try {
    // 推薦曲を取得するファンクションを呼び出す
    const { data, error } = await supabase.rpc("get_recommendations", {
      p_user_id: user.id,
      p_limit: limit,
    });

    if (error) {
      console.error("Error fetching recommendations:", error);
      return [];
    }

    // データがない場合は空配列を返す
    if (!data) {
      return [];
    }

    // データを整形して返す
    return data.map((item: SongWithRecommendation) => ({
      id: item.id,
      title: item.title,
      author: item.author,
      song_path: item.song_path,
      image_path: item.image_path,
      genre: item.genre,
      count: item.count,
      like_count: item.like_count,
      created_at: item.created_at,
      user_id: user.id,
      recommendation_score: item.recommendation_score,
    }));
  } catch (e) {
    console.error("Exception in getRecommendations:", e);
    return [];
  }
};

export default getRecommendations;
