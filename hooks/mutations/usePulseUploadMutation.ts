"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useUser } from "@/hooks/auth/useUser";
import { createClient } from "@/libs/supabase/client";
import { uploadFileToR2 } from "@/actions/r2";
import { checkIsAdmin } from "@/actions/checkAdmin";
import { CACHED_QUERIES } from "@/constants";

interface PulseUploadParams {
  title: string;
  genre: string;
  musicFile: File | null;
}

interface PulseUploadModalHook {
  onClose: () => void;
}

async function uploadFile(
  file: File,
  bucketName: "pulse",
  fileNamePrefix: string
): Promise<string | null> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("bucketName", bucketName);
  formData.append("fileNamePrefix", fileNamePrefix);

  const result = await uploadFileToR2(formData);

  if (!result.success) {
    throw new Error(result.error || "アップロードに失敗しました");
  }

  return result.url || null;
}

const usePulseUploadMutation = (pulseUploadModal: PulseUploadModalHook) => {
  const supabaseClient = createClient();
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async ({ title, genre, musicFile }: PulseUploadParams) => {
      const { isAdmin } = await checkIsAdmin();
      if (!isAdmin) {
        toast.error("管理者権限が必要です");
        throw new Error("管理者権限が必要です");
      }

      if (!musicFile || !user) {
        toast.error("音声ファイルを選択してください");
        throw new Error("音声ファイルを選択してください");
      }

      if (!title.trim()) {
        toast.error("タイトルを入力してください");
        throw new Error("タイトルを入力してください");
      }

      if (!genre.trim()) {
        toast.error("ジャンルを入力してください");
        throw new Error("ジャンルを入力してください");
      }

      let musicUrl: string | null;
      try {
        musicUrl = await uploadFile(musicFile, "pulse", "pulse");
      } catch (error) {
        toast.error("音声のアップロードに失敗しました");
        throw new Error("音声のアップロードに失敗しました");
      }

      if (!musicUrl) {
        toast.error("音声のアップロードに失敗しました");
        throw new Error("音声のアップロードに失敗しました");
      }

      const { error } = await supabaseClient.from("pulses").insert({
        music_path: musicUrl,
        title,
        genre,
      });

      if (error) {
        toast.error(error.message);
        throw new Error(error.message);
      }

      return { title, genre };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CACHED_QUERIES.pulse] });
      toast.success("Pulseを投稿しました!");
      pulseUploadModal.onClose();
    },
    onError: (error: Error) => {
      console.error("Pulse upload error:", error);
    },
  });
};

export default usePulseUploadMutation;
