"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/auth/useUser";
import { createClient } from "@/libs/supabase/client";
import { uploadFileToR2 } from "@/actions/r2";
import { checkIsAdmin } from "@/actions/checkAdmin";
import { sanitizeTitle } from "@/libs/utils";
import uniqid from "uniqid";
import { CACHED_QUERIES } from "@/constants";

interface UploadSongParams {
  title: string;
  author: string;
  lyrics: string;
  genre: string[];
  songFile: File | null;
  imageFile: File | null;
}

interface UploadModalHook {
  onClose: () => void;
}

/**
 * 曲のアップロード処理を行うカスタムフック
 *
 * @param uploadModal アップロードモーダルのフック
 * @returns アップロードミューテーション
 */
const useUploadSongMutation = (uploadModal: UploadModalHook) => {
  const supabaseClient = createClient();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { user } = useUser();
  return useMutation({
    mutationFn: async ({
      title,
      author,
      lyrics,
      genre,
      songFile,
      imageFile,
    }: UploadSongParams) => {
      // 管理者権限チェック
      const { isAdmin } = await checkIsAdmin();

      if (!isAdmin) {
        toast.error("管理者権限が必要です");
        throw new Error("管理者権限が必要です");
      }

      if (!songFile || !imageFile || !user) {
        toast.error("必須フィールドが未入力です");
        throw new Error("必須フィールドが未入力です");
      }

      const uniqueID = uniqid();
      const songFileNamePrefix = `song-${sanitizeTitle(title)}-${uniqueID}`;
      const imageFileNamePrefix = `image-${sanitizeTitle(title)}-${uniqueID}`;

      // Upload song to R2
      const songFormData = new FormData();
      songFormData.append("file", songFile);
      songFormData.append("bucketName", "song");
      songFormData.append("fileNamePrefix", songFileNamePrefix);

      const songResult = await uploadFileToR2(songFormData);

      // Upload image to R2
      const imageFormData = new FormData();
      imageFormData.append("file", imageFile);
      imageFormData.append("bucketName", "image");
      imageFormData.append("fileNamePrefix", imageFileNamePrefix);

      const imageResult = await uploadFileToR2(imageFormData);

      if (
        !songResult.success ||
        !imageResult.success ||
        !songResult.url ||
        !imageResult.url
      ) {
        toast.error(
          songResult.error ||
            imageResult.error ||
            "ファイルのアップロードに失敗しました"
        );
        throw new Error(
          songResult.error ||
            imageResult.error ||
            "ファイルのアップロードに失敗しました"
        );
      }

      const songUrl = songResult.url;
      const imageUrl = imageResult.url;

      // Create record
      const { error: supabaseError } = await supabaseClient
        .from("songs")
        .insert({
          user_id: user.id,
          title,
          author,
          lyrics,
          image_path: imageUrl,
          song_path: songUrl,
          genre: genre.join(", "),
          count: 0,
        });

      if (supabaseError) {
        toast.error(supabaseError.message);
        throw new Error(supabaseError.message);
      }

      return { title, author };
    },
    onSuccess: () => {
      // キャッシュを無効化
      queryClient.invalidateQueries({ queryKey: [CACHED_QUERIES.songById] });
      queryClient.invalidateQueries({ queryKey: [CACHED_QUERIES.trendSongs] });

      // UIを更新
      router.refresh();
      toast.success("曲をアップロードしました");

      // モーダルを閉じる
      uploadModal.onClose();
    },
    onError: (error: Error) => {
      console.error("Upload song error:", error);
      toast.error(error.message || "アップロードに失敗しました");
    },
  });
};

export default useUploadSongMutation;
