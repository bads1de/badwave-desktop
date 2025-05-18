"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/auth/useUser";
import { createClient } from "@/libs/supabase/client";
import uploadFileToR2 from "@/actions/uploadFileToR2";
import { sanitizeTitle } from "@/libs/helpers";
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
      if (!songFile || !imageFile || !user) {
        toast.error("必須フィールドが未入力です");
        throw new Error("必須フィールドが未入力です");
      }

      const uniqueID = uniqid();
      const songFileNamePrefix = `song-${sanitizeTitle(title)}-${uniqueID}`;
      const imageFileNamePrefix = `image-${sanitizeTitle(title)}-${uniqueID}`;

      // Upload song to R2
      const songUrl = await uploadFileToR2({
        file: songFile,
        bucketName: "song",
        fileType: "audio",
        fileNamePrefix: songFileNamePrefix,
      });

      // Upload image to R2
      const imageUrl = await uploadFileToR2({
        file: imageFile,
        bucketName: "image",
        fileType: "image",
        fileNamePrefix: imageFileNamePrefix,
      });

      if (!songUrl || !imageUrl) {
        toast.error("ファイルのアップロードに失敗しました");
        throw new Error("ファイルのアップロードに失敗しました");
      }

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
      // エラーメッセージはmutationFn内で表示しているため、ここでは何もしない
    },
  });
};

export default useUploadSongMutation;
