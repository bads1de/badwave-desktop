"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { createClient } from "@/libs/supabase/client";
import { deleteFileFromR2 } from "@/actions/r2";
import { checkIsAdmin } from "@/actions/checkAdmin";
import { useUser } from "@/hooks/auth/useUser";
import { CACHED_QUERIES } from "@/constants";

interface DeleteSongParams {
  songId: string;
}

/**
 * 曲の削除処理を行うカスタムフック
 *
 * @returns 削除ミューテーション
 */
const useDeleteSongMutation = () => {
  const supabaseClient = createClient();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { user } = useUser();

  return useMutation({
    mutationFn: async ({ songId }: DeleteSongParams) => {
      if (!user?.id) {
        throw new Error("ログインが必要です");
      }

      // 管理者権限チェック
      const { isAdmin } = await checkIsAdmin();
      if (!isAdmin) {
        toast.error("管理者権限が必要です");
        throw new Error("管理者権限が必要です");
      }

      // データベースから削除（削除されたレコードを取得）
      const { data, error: dbDeleteError } = await supabaseClient
        .from("songs")
        .delete()
        .eq("user_id", user.id)
        .eq("id", parseInt(songId, 10))
        .select("*");

      if (dbDeleteError) {
        console.error(
          "Failed to delete record from database:",
          dbDeleteError.message
        );
        throw new Error(
          "Failed to delete record from database: " + dbDeleteError.message
        );
      }

      if (data.length === 0) {
        console.error(
          "No record was deleted from database. Please check the songId:",
          songId
        );
        throw new Error(
          "No record was deleted from database. Please check the songId."
        );
      }

      const deletedSong = data[0];

      // R2ストレージからファイルを削除
      if (deletedSong.song_path) {
        const songFileName = deletedSong.song_path.split("/").pop();
        if (songFileName) {
          const result = await deleteFileFromR2("song", songFileName);
          if (!result.success) {
            console.error("Failed to delete song file:", result.error);
          }
        }
      }

      if (deletedSong.image_path) {
        const imageFileName = deletedSong.image_path.split("/").pop();
        if (imageFileName) {
          const result = await deleteFileFromR2("image", imageFileName);
          if (!result.success) {
            console.error("Failed to delete image file:", result.error);
          }
        }
      }

      return { songId };
    },
    onSuccess: ({ songId }) => {
      // 関連するキャッシュを無効化
      queryClient.invalidateQueries({
        queryKey: [CACHED_QUERIES.songById, songId],
      });
      queryClient.invalidateQueries({ queryKey: [CACHED_QUERIES.trendSongs] });
      queryClient.invalidateQueries({
        queryKey: [CACHED_QUERIES.songsByGenres],
      });
      queryClient.invalidateQueries({ queryKey: [CACHED_QUERIES.likedSongs] });

      // UIを更新
      router.refresh();
      toast.success("削除しました");
    },
    onError: (error: Error) => {
      console.error("Delete song error:", error);
      if (error.message !== "管理者権限が必要です") {
        toast.error(error.message || "削除に失敗しました");
      }
    },
  });
};

export default useDeleteSongMutation;
