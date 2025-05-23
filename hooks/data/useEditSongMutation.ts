"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { createClient } from "@/libs/supabase/client";
import uploadFileToR2 from "@/actions/uploadFileToR2";
import deleteFileFromR2 from "@/actions/deleteFileFromR2";
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
      const uploadedUrl = await uploadFileToR2({
        file,
        bucketName,
        fileType,
        fileNamePrefix,
      });

      if (!uploadedUrl) {
        toast.error(
          `${
            fileType === "video" ? "動画" : fileType === "audio" ? "曲" : "画像"
          }のアップロードに失敗しました`
        );
        return null;
      }

      // 古いファイルを削除
      if (currentPath) {
        await deleteFileFromR2({
          bucketName,
          filePath: currentPath.split("/").pop()!,
          showToast: false,
        });
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
      toast.error("編集に失敗しました");
    },
  });
};

export default useEditSongMutation;
