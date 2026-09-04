"use client";

import { useState, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import Image from "next/image";

import { Song } from "@/types";
import Modal from "./Modal";
import Input from "../common/Input";
import { getPlayableImagePath } from "@/libs/songUtils";
import { Textarea } from "../ui/textarea";
import GenreSelect from "../genre/GenreSelect";
import Button from "../common/Button";
import useEditSongMutation from "@/hooks/mutations/useEditSongMutation";
import { toast } from "react-hot-toast";
import { Sparkles } from "lucide-react";
import { ERROR_MESSAGES } from "@/constants/errorMessages";

interface EditFormValues extends Partial<Song> {
  video?: FileList;
  song?: FileList;
  image?: FileList;
}

interface EditModalProps {
  song: Song;
  isOpen: boolean;
  onClose: () => void;
}

const EditModal = ({ song, isOpen, onClose }: EditModalProps) => {
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // TanStack Queryを使用したミューテーション
  const { mutateAsync, isPending: isLoading } = useEditSongMutation({
    onClose,
  });

  const { register, handleSubmit, reset, setValue, watch, getValues } =
    useForm<EditFormValues>({
      defaultValues: {
        id: song.id,
        user_id: song.user_id,
        title: song.title,
        author: song.author,
        lyrics: song.lyrics,
        image_path: song.image_path,
        video_path: song.video_path || "",
        song_path: song.song_path,
        genre: song.genre || "All",
      },
    });

  const handleTranscribeSync = async () => {
    const lyrics = getValues("lyrics");
    if (!lyrics) {
      toast.error(ERROR_MESSAGES.LYRICS_REQUIRED);
      return;
    }

    if (!song.song_path) {
      toast.error(ERROR_MESSAGES.SONG_FILE_NOT_FOUND);
      return;
    }

    setIsGenerating(true);
    const toastId = toast.loading("自動同期中... (初回は数分かかります)");

    try {
      const electron = window.electron;

      // transcribe.ts は URL とローカルパスの両方を処理できる
      // URL の場合は内部でダウンロードしてくれる
      const result = await electron.transcribe.generateLrc(
        song.song_path,
        lyrics,
      );

      if (result.status === "success") {
        setValue("lyrics", result.lrc);
        toast.success("自動同期が完了しました", { id: toastId });
      } else {
        toast.error(result.message || ERROR_MESSAGES.SYNC_FAILED, { id: toastId });
      }
    } catch (error) {
      console.error("Transcribe Sync Error:", error);
      toast.error(ERROR_MESSAGES.GENERIC_ERROR, { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  const watchVideo = watch("video");
  const watchSong = watch("song");
  const watchImage = watch("image");

  useEffect(() => {
    if (isOpen) {
      reset({
        id: song.id,
        user_id: song.user_id,
        title: song.title,
        author: song.author,
        lyrics: song.lyrics,
        image_path: song.image_path,
        song_path: song.song_path,
        genre: song.genre || "All",
        video_path: song.video_path || "",
        video: undefined,
        song: undefined,
        image: undefined,
      });
      setSelectedGenres(song.genre ? song.genre.split(", ") : []);
    }
  }, [isOpen, song, reset]);

  const onSubmit: SubmitHandler<EditFormValues> = async (values) => {
    try {
      // TanStack Queryのミューテーションを使用
      await mutateAsync({
        id: song.id,
        title: values.title!,
        author: values.author!,
        lyrics: values.lyrics,
        genre: selectedGenres,
        videoFile: values.video?.[0] || null,
        songFile: values.song?.[0] || null,
        imageFile: values.image?.[0] || null,
        currentSong: song,
      });

      // 成功時の処理はミューテーションのonSuccessで行われる
    } catch (error) {
      // エラー処理はミューテーション内で行われるため、ここでは何もしない
      console.error("Edit error:", error);
    }
  };

  return (
    <Modal
      title="曲を編集"
      description="曲の情報を編集します。"
      isOpen={isOpen}
      onChange={() => onClose()}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-y-4">
        <Input
          disabled={isLoading}
          {...register("title", { required: true })}
          placeholder="曲のタイトル"
        />
        <Input
          disabled={isLoading}
          {...register("author", { required: true })}
          placeholder="曲の作者"
        />
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">歌詞</label>
          {song.song_path && (
            <button
              type="button"
              disabled={isLoading || isGenerating}
              onClick={handleTranscribeSync}
              className="flex items-center gap-x-1 text-xs text-primary hover:underline disabled:text-neutral-500 disabled:no-underline transition"
            >
              <Sparkles className="h-3 w-3" />
              {isGenerating ? "生成中..." : "transcribe"}
            </button>
          )}
        </div>
        <Textarea
          disabled={isLoading || isGenerating}
          {...register("lyrics")}
          placeholder="歌詞"
          className="bg-neutral-700 min-h-[150px]"
        />
        <GenreSelect
          onGenreChange={(genres: string) => setSelectedGenres([genres])}
        />

        <div>
          <div className="pb-1">曲を選択（50MB以下）</div>
          <Input
            disabled={isLoading}
            type="file"
            accept="audio/*"
            {...register("song")}
          />
          {song.song_path && (
            <div className="mt-2">
              <audio controls className="w-full mt-2">
                <source src={song.song_path} type="audio/mpeg" />
              </audio>
            </div>
          )}
        </div>

        <div>
          <div className="pb-1">画像を選択（5MB以下）</div>
          <Input
            disabled={isLoading}
            type="file"
            accept="image/*"
            {...register("image")}
          />
          {song.image_path && (
            <div className="mt-2 relative w-32 h-32">
              <Image
                src={getPlayableImagePath(song)}
                alt="現在の画像"
                fill
                className="object-cover rounded-md"
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width:1280px) 25vw, 20vw"
              />
            </div>
          )}
        </div>

        <div>
          <div className="pb-1">ビデオを選択（50MB以下）</div>
          <Input
            disabled={isLoading}
            type="file"
            accept="video/*"
            {...register("video")}
          />
          {song.video_path && (
            <div className="mt-2">
              <a
                href={song.video_path}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 underline"
              >
                既存のビデオを確認
              </a>
            </div>
          )}
        </div>

        <Button disabled={isLoading} type="submit">
          {isLoading ? "編集中..." : "編集"}
        </Button>
      </form>
    </Modal>
  );
};

export default EditModal;
