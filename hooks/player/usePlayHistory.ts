import { createClient } from "@/libs/supabase/client";
import { useCallback } from "react";
import { useUser } from "../auth/useUser";

/**
 * 再生履歴を管理するカスタムフック
 * @returns {{recordPlay: (songId: string) => Promise<void>}} 再生を記録する関数を含むオブジェクト
 */
const usePlayHistory = () => {
  const supabase = createClient();
  const { userDetails } = useUser();

  /**
   * 曲の再生を記録する関数
   * @param {string} songId - 再生された曲のID
   */
  const recordPlay = useCallback(
    async (songId: string) => {
      if (!userDetails?.id || !songId) return;

      const { error } = await supabase
        .from("play_history")
        .insert({ user_id: userDetails.id, song_id: songId });

      if (error) {
        console.error("再生の記録中にエラーが発生しました:", error);
      }
    },
    [supabase, userDetails?.id]
  );

  return { recordPlay };
};

export default usePlayHistory;
