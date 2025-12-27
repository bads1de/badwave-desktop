"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { createClient } from "@/libs/supabase/client";
import { uploadFileToR2, deleteFileFromR2 } from "@/actions/r2";
import { checkIsAdmin } from "@/actions/checkAdmin";
import { sanitizeTitle } from "@/libs/helpers";
import { CACHED_QUERIES } from "@/constants";
import { Song } from "@/types";

interface EditSongParams {
  id: string;
  title: string;
  author: string;
  lyrics?: string;
  genre: string[];
  videoFile?: File | null;
  songFile?: File | null;
  imageFile?: File | null;
  currentSong: Song;
}

interface EditModalHook {
  onClose: () => void;
}

/**
 * 曲の編集処理を行うカスタムフック
 *
 * @param editModal 編集モーダルのフック
 * @returns 編集ミューテーション
 */
const useEditSongMutation = (editModal: EditModalHook) => {
  const supabaseClient = createClient();
  const queryClient = useQueryClient();
  const router = useRouter();

  /**
   * ファイルのアップロード処理
   *
   * @param params アップロードパラメータ
   * @returns アップロードされたファイルのURL
   */
  const handleFileUpload = async ({
    file,
    bucketName,
    fileType,
    fileNamePrefix,
    currentPath,
  }: {
    file: File;
    bucketName: "video" | "song" | "image";
    fileType: "video" | "audio" | "image";
    fileNamePrefix: string;
    currentPath?: string;
  }) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucketName", bucketName);
      formData.append("fileNamePrefix", fileNamePrefix);

      const result = await uploadFileToR2(formData);

      if (!result.success || !result.url) {
        toast.error(
          result.error ||
            `${
              fileType === "video"
                ? "動画"
                : fileType === "audio"
                ? "曲"
                : "画像"
            }のアップロードに失敗しました`
        );
        return null;
      }

      const uploadedUrl = result.url;

      // 古いファイルを削除
      if (currentPath) {
        const deleteResult = await deleteFileFromR2(
          bucketName,
          currentPath.split("/").pop()!
        );
        if (!deleteResult.success) {
          console.error("ファイルの削除に失敗しました", deleteResult.error);
        }
      }

      return uploadedUrl;
    } catch (error) {
      console.error(`${fileType} upload error:`, error);
      return null;
    }
  };

  return useMutation({
    mutationFn: async ({
      id,
      title,
      author,
      lyrics,
      genre,
      videoFile,
      songFile,
      imageFile,
      currentSong,
    }: EditSongParams) => {
      // 管理者権限チェック
      const { isAdmin } = await checkIsAdmin();

      if (!isAdmin) {
        toast.error("管理者権限が必要です");
        throw new Error("管理者権限が必要です");
      }

      if (!id) {
        toast.error("曲のIDが必要です");
        throw new Error("曲のIDが必要です");
      }

      let updatedVideoPath = currentSong.video_path;
      let updatedSongPath = currentSong.song_path;
      let updatedImagePath = currentSong.image_path;

      // 動画ファイルがある場合はアップロード
      if (videoFile) {
        const videoPath = await handleFileUpload({
          file: videoFile,
          bucketName: "video",
          fileType: "video",
          fileNamePrefix: `video-${sanitizeTitle(title)}`,
          currentPath: currentSong.video_path,
        });
        if (videoPath) updatedVideoPath = videoPath;
      }

      // 音楽ファイルがある場合はアップロード
      if (songFile) {
        const songPath = await handleFileUpload({
          file: songFile,
          bucketName: "song",
          fileType: "audio",
          fileNamePrefix: `song-${sanitizeTitle(title)}`,
          currentPath: currentSong.song_path,
        });
        if (songPath) updatedSongPath = songPath;
      }

      // 画像ファイルがある場合はアップロード
      if (imageFile) {
        const imagePath = await handleFileUpload({
          file: imageFile,
          bucketName: "image",
          fileType: "image",
          fileNamePrefix: `image-${sanitizeTitle(title)}`,
          currentPath: currentSong.image_path,
        });
        if (imagePath) updatedImagePath = imagePath;
      }

      // データベースを更新
      const { error } = await supabaseClient
        .from("songs")
        .update({
          title,
          author,
          lyrics,
          genre: genre.join(", "),
          video_path: updatedVideoPath,
          song_path: updatedSongPath,
          image_path: updatedImagePath,
        })
        .eq("id", id);

      if (error) {
        throw error;
      }

      return { id, title };
    },
    onSuccess: ({ id }) => {
      // 関連するキャッシュを無効化
      queryClient.invalidateQueries({
        queryKey: [CACHED_QUERIES.songById, id],
      });
      queryClient.invalidateQueries({ queryKey: [CACHED_QUERIES.trendSongs] });
      queryClient.invalidateQueries({
        queryKey: [CACHED_QUERIES.songsByGenres],
      });

      // UIを更新
      router.refresh();
      toast.success("曲を編集しました");

      // モーダルを閉じる
      editModal.onClose();
    },
    onError: (error: Error) => {
      console.error("Edit song error:", error);
      toast.error(error.message || "編集に失敗しました");
    },
  });
};

export default useEditSongMutation;
