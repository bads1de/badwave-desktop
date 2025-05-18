"use client";

import * as React from "react";
import {
  useState,
  useRef,
  useEffect,
  DragEvent,
  memo,
  useCallback,
} from "react";
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import Image from "next/image";

import useUploadModal from "@/hooks/modal/useUploadModal";
import { useUser } from "@/hooks/auth/useUser";
import useUploadSongMutation from "@/hooks/data/useUploadSongMutation";

import Modal from "./Modal";
import Input from "../common/Input";
import { Textarea } from "../ui/textarea";
import GenreSelect from "../Genre/GenreSelect";
import Button from "../common/Button";

const UploadModal: React.FC = memo(() => {
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [audioPreview, setAudioPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const uploadModal = useUploadModal();
  const { user } = useUser();

  // TanStack Queryを使用したミューテーション
  const { mutateAsync, isPending: isLoading } =
    useUploadSongMutation(uploadModal);

  const { register, handleSubmit, reset, watch, setValue } =
    useForm<FieldValues>({
      defaultValues: {
        author: "",
        title: "",
        lyrics: "",
        song: null,
        image: null,
      },
    });

  const song = watch("song");
  const image = watch("image");

  const handleFileDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    handleFiles(files);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files) handleFiles(files);
    },
    []
  );

  const handleFiles = useCallback(
    (files: FileList) => {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (file.type.startsWith("audio/")) {
          setValue("song", [file]);
          setAudioPreview(URL.createObjectURL(file));
        } else if (file.type.startsWith("image/")) {
          setValue("image", [file]);
          setImagePreview(URL.createObjectURL(file));
        } else {
          toast.error("サポートされていないファイル形式です");
        }
      }
    },
    [setValue]
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (image && image.length > 0) {
      const file = image[0];
      setImagePreview(URL.createObjectURL(file));
    }
  }, [image]);

  useEffect(() => {
    if (song && song.length > 0) {
      const file = song[0];
      setAudioPreview(URL.createObjectURL(file));
    }
  }, [song]);

  const onChange = useCallback(
    (open: boolean) => {
      if (!open) {
        reset();
        setImagePreview(null);
        setAudioPreview(null);
        uploadModal.onClose();
      }
    },
    [reset, uploadModal]
  );

  const onSubmit: SubmitHandler<FieldValues> = useCallback(
    async (values) => {
      try {
        const imageFile = values.image?.[0];
        const songFile = values.song?.[0];

        if (!imageFile || !songFile || !user) {
          toast.error("必須フィールドが未入力です");
          return;
        }

        // TanStack Queryのミューテーションを使用
        await mutateAsync({
          title: values.title,
          author: values.author,
          lyrics: values.lyrics,
          genre: selectedGenres,
          songFile,
          imageFile,
        });

        // 成功時の処理（ミューテーションのonSuccessで処理されるため、ここでは最小限の処理のみ）
        reset();
        setImagePreview(null);
        setAudioPreview(null);
      } catch (error) {
        // エラー処理はミューテーション内で行われるため、ここでは何もしない
        console.error("Upload error:", error);
      }
    },
    [mutateAsync, reset, user, selectedGenres, setImagePreview, setAudioPreview]
  );

  return (
    <Modal
      title="曲をアップロード"
      description="mp3ファイルと画像ファイルを選択してください"
      isOpen={uploadModal.isOpen}
      onChange={onChange}
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="title" className="text-sm text-zinc-400">
                タイトル
              </label>
              <Input
                id="title"
                disabled={isLoading}
                {...register("title", { required: true })}
                placeholder="曲のタイトル"
                className="h-9 bg-zinc-800/50 border-zinc-700/50 focus:border-white/30"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="author" className="text-sm text-zinc-400">
                アーティスト
              </label>
              <Input
                id="author"
                disabled={isLoading}
                {...register("author", { required: true })}
                placeholder="アーティスト名"
                className="h-9 bg-zinc-800/50 border-zinc-700/50 focus:border-white/30"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="lyrics" className="text-sm text-zinc-400">
              歌詞
            </label>
            <Textarea
              id="lyrics"
              disabled={isLoading}
              {...register("lyrics")}
              placeholder="歌詞"
              className="bg-zinc-800/50 border-zinc-700/50 focus:border-white/30 h-28 resize-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-zinc-400">ジャンル</label>
            <GenreSelect
              onGenreChange={(genres: string) => setSelectedGenres([genres])}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm text-zinc-400">ファイルを選択</label>
            <div
              ref={dropRef}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleFileDrop}
              className={`relative p-3 border-2 border-dashed rounded-lg transition-colors ${
                isDragging
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-zinc-700/50 bg-zinc-800/50"
              }`}
            >
              <Input
                type="file"
                accept="audio/*,image/*"
                id="file"
                disabled={isLoading}
                onChange={handleFileInput}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                multiple
              />
              <div className="text-center py-2">
                <p className="text-sm text-zinc-400">
                  クリックまたはドラッグ&ドロップ
                </p>
                <p className="text-xs text-zinc-500">MP3および画像ファイル</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {imagePreview && (
              <div className="aspect-square relative overflow-hidden rounded-lg border border-zinc-700/50">
                <Image
                  src={imagePreview}
                  alt="アップロードされた画像のプレビュー"
                  className="object-cover"
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width:1280px) 25vw, 20vw"
                />
              </div>
            )}
            {audioPreview && (
              <div className="flex items-center p-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                <audio ref={audioRef} controls className="w-full h-8">
                  <source src={audioPreview} type="audio/mpeg" />
                </audio>
              </div>
            )}
          </div>
        </div>

        <Button disabled={isLoading} type="submit" className="col-span-full ">
          {isLoading ? "アップロード中..." : "アップロード"}
        </Button>
      </form>
    </Modal>
  );
});

// displayName を設定
UploadModal.displayName = "UploadModal";

export default UploadModal;
