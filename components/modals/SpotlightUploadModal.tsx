"use client";

import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { useForm, SubmitHandler, FieldValues } from "react-hook-form";
import { RiVideoLine, RiUploadCloud2Line } from "react-icons/ri";

import { useUser } from "@/hooks/auth/useUser";

import Modal from "./Modal";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";

import useSpotLightUploadModal from "@/hooks/modal/useSpotLightUpload";
import useSpotlightUploadMutation from "@/hooks/mutations/useSpotlightUploadMutation";

const SpotlightUploadModal: React.FC = memo(() => {
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const spotlightUploadModal = useSpotLightUploadModal();
  const { user } = useUser();

  // TanStack Queryを使用したミューテーション
  const { mutateAsync, isPending: isLoading } =
    useSpotlightUploadMutation(spotlightUploadModal);

  const { register, handleSubmit, reset, setValue, watch } =
    useForm<FieldValues>({
      defaultValues: {
        video: null,
        title: "",
        author: "",
        genre: "",
        description: "",
      },
    });

  const video = watch("video");

  useEffect(() => {
    if (video && video.length > 0) {
      const file = video[0];
      setVideoPreview(URL.createObjectURL(file));
    }
  }, [video]);

  useEffect(() => {
    if (!spotlightUploadModal.isOpen) {
      reset();
      setVideoPreview(null);
    }
  }, [spotlightUploadModal.isOpen, reset]);

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setValue("video", [file]);
        setVideoPreview(URL.createObjectURL(file));
      }
    },
    [setValue]
  );

  const onChange = useCallback(
    (open: boolean) => {
      if (!open) {
        reset();
        setVideoPreview(null);
        spotlightUploadModal.onClose();
      }
    },
    [reset, spotlightUploadModal]
  );

  const onSubmit: SubmitHandler<FieldValues> = useCallback(
    async (values) => {
      try {
        // TanStack Queryのミューテーションを使用
        await mutateAsync({
          title: values.title,
          author: values.author,
          genre: values.genre,
          description: values.description,
          videoFile: values.video?.[0] || null,
        });

        // 成功時の処理はミューテーションのonSuccessで行われる
        reset();
        setVideoPreview(null);
      } catch (error) {
        // エラー処理はミューテーション内で行われる
        console.error("Spotlight upload error:", error);
      }
    },
    [mutateAsync, reset]
  );

  return (
    <Modal
      title="Spotlightに動画を投稿"
      description="動画をアップロードしてSpotlightで共有しましょう！"
      isOpen={spotlightUploadModal.isOpen}
      onChange={onChange}
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-y-3"
        aria-label="Spotlight投稿"
      >
        {/* タイトル・投稿者名（2カラム） */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="title" className="text-xs text-zinc-400">
              タイトル
            </label>
            <Input
              id="title"
              disabled={isLoading}
              {...register("title", { required: true })}
              placeholder="動画のタイトル"
              className="h-9 bg-zinc-800/50 border-zinc-700/50 focus:border-theme-500/50"
            />
          </div>
          <div>
            <label htmlFor="author" className="text-xs text-zinc-400">
              投稿者名
            </label>
            <Input
              id="author"
              disabled={isLoading}
              {...register("author", { required: true })}
              placeholder="あなたの名前"
              className="h-9 bg-zinc-800/50 border-zinc-700/50 focus:border-theme-500/50"
            />
          </div>
        </div>

        {/* ジャンル・説明（2カラム） */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="genre" className="text-xs text-zinc-400">
              ジャンル
            </label>
            <Input
              id="genre"
              disabled={isLoading}
              {...register("genre")}
              placeholder="例: Music Video"
              className="h-9 bg-zinc-800/50 border-zinc-700/50 focus:border-theme-500/50"
            />
          </div>
          <div>
            <label htmlFor="description" className="text-xs text-zinc-400">
              説明
            </label>
            <Input
              id="description"
              disabled={isLoading}
              {...register("description")}
              placeholder="動画の説明"
              className="h-9 bg-zinc-800/50 border-zinc-700/50 focus:border-theme-500/50"
            />
          </div>
        </div>

        {/* 動画ファイル選択 */}
        <div>
          <label htmlFor="video" className="text-xs text-zinc-400">
            動画ファイル
          </label>
          <div
            className="
              relative p-3 border-2 border-dashed rounded-lg 
              bg-zinc-800/30 border-zinc-700/50 
              hover:border-theme-500/50 hover:bg-zinc-800/50
              hover:shadow-[0_0_15px_rgba(var(--theme-rgb),0.15)]
              transition-all duration-300 cursor-pointer
              group
            "
          >
            <Input
              type="file"
              accept="video/*"
              id="video"
              disabled={isLoading}
              onChange={onFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-theme-500/10 group-hover:bg-theme-500/20 transition-colors">
                <RiUploadCloud2Line className="w-5 h-5 text-theme-400 group-hover:text-theme-300 transition-colors" />
              </div>
              <div>
                <p className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors">
                  クリックまたはドラッグ&ドロップ
                </p>
                <p className="text-xs text-zinc-500">MP4, WebM, MOV</p>
              </div>
            </div>
          </div>
        </div>

        {/* 動画プレビュー */}
        {videoPreview && (
          <div className="p-2 rounded-lg bg-zinc-800/50 border border-zinc-700/30">
            <video
              ref={videoRef}
              controls
              className="w-full rounded max-h-32 object-contain bg-black"
            >
              <source src={videoPreview} />
            </video>
          </div>
        )}

        {/* 送信ボタン */}
        <Button
          disabled={isLoading}
          type="submit"
          className=" bg-gradient-to-r from-theme-500 to-theme-600 hover:from-theme-600 hover:to-theme-700 text-white font-medium py-2.5 rounded-xl transition-all duration-300 shadow-lg shadow-theme-500/20 hover:shadow-theme-500/40"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              アップロード中...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <RiVideoLine className="w-5 h-5 " />
              Spotlightに投稿
            </span>
          )}
        </Button>
      </form>
    </Modal>
  );
});

// displayName を設定
SpotlightUploadModal.displayName = "SpotlightUploadModal";

export default SpotlightUploadModal;
