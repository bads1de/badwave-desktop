"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/auth/useUser";
import { createClient } from "@/libs/supabase/client";
import uploadFileToR2 from "@/actions/uploadFileToR2";
import { CACHED_QUERIES } from "@/constants";

interface SpotlightUploadParams {
  title: string;
  author: string;
  genre: string;
  description: string;
  videoFile: File | null;
}

interface SpotlightUploadModalHook {
  onClose: () => void;
}

/**
 * Spotlightへの動画アップロード処理を行うカスタムフック
 *
 * @param spotlightUploadModal アップロードモーダルのフック
 * @returns アップロードミューテーション
 */
const useSpotlightUploadMutation = (
  spotlightUploadModal: SpotlightUploadModalHook
) => {
  const supabaseClient = createClient();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { user } = useUser();

  return useMutation({
    mutationFn: async ({
      title,
      author,
      genre,
      description,
      videoFile,
    }: SpotlightUploadParams) => {
      if (!videoFile || !user) {
        toast.error("動画ファイルを選択してください");
        throw new Error("動画ファイルを選択してください");
      }

      // 動画をR2にアップロード
      const videoUrl = await uploadFileToR2({
        file: videoFile,
        bucketName: "spotlight",
        fileType: "video",
        fileNamePrefix: "spotlight",
      });

      if (!videoUrl) {
        toast.error("動画のアップロードに失敗しました");
        throw new Error("動画のアップロードに失敗しました");
      }

      // データベースにレコードを作成
      const { error } = await supabaseClient.from("spotlights").insert({
        video_path: videoUrl,
        title,
        author,
        genre,
        description,
        user_id: user.id,
      });

      if (error) {
        toast.error(error.message);
        throw new Error(error.message);
      }

      return { title, author };
    },
    onSuccess: () => {
      // キャッシュを無効化
      queryClient.invalidateQueries({ queryKey: [CACHED_QUERIES.spotlight] });

      // UIを更新
      router.refresh();
      toast.success("Spotlightに投稿しました!");

      // モーダルを閉じる
      spotlightUploadModal.onClose();
    },
    onError: (error: Error) => {
      console.error("Spotlight upload error:", error);
      // エラーメッセージはmutationFn内で表示しているため、ここでは何もしない
    },
  });
};

export default useSpotlightUploadMutation;
