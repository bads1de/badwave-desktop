import { Spotlight } from "@/types";
import { createClient } from "@/libs/supabase/server";

/**
 * @returns Spotlight[]
 * サーバーコンポーネントクライアントを作成し、データベースからスポットライトを取得します。
 * スポットライトは、作成日の降順で並べ替えられます。
 * エラーが発生した場合は、エラーメッセージをコンソールに出力します。
 *
 */
const getSpotlight = async (): Promise<Spotlight[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("spotlights")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.log("Error fetching spotlights:", error.message);
    return [];
  }

  return (data as Spotlight[]) || [];
};

export default getSpotlight;
