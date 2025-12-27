"use client";

import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { useForm, SubmitHandler, FieldValues } from "react-hook-form";
import { RiPulseLine } from "react-icons/ri";

import { useUser } from "@/hooks/auth/useUser";
import usePulseUploadModal from "@/hooks/modal/usePulseUploadModal";
import usePulseUploadMutation from "@/hooks/data/usePulseUploadMutation";

import Modal from "./Modal";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";

const PulseUploadModal: React.FC = memo(() => {
  const [audioPreview, setAudioPreview] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const pulseUploadModal = usePulseUploadModal();
  const { user } = useUser();

  const { mutateAsync, isPending: isLoading } =
    usePulseUploadMutation(pulseUploadModal);

  const { register, handleSubmit, reset, setValue, watch } =
    useForm<FieldValues>({
      defaultValues: {
        music: null,
        title: "",
        genre: "",
      },
    });

  const music = watch("music");

  useEffect(() => {
    if (music && music.length > 0) {
      const file = music[0];
      setAudioPreview(URL.createObjectURL(file));
    }
  }, [music]);

  useEffect(() => {
    if (!pulseUploadModal.isOpen) {
      reset();
      setAudioPreview(null);
    }
  }, [pulseUploadModal.isOpen, reset]);

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setValue("music", [file]);
        setAudioPreview(URL.createObjectURL(file));
      }
    },
    [setValue]
  );

  const onChange = useCallback(
    (open: boolean) => {
      if (!open) {
        reset();
        setAudioPreview(null);
        pulseUploadModal.onClose();
      }
    },
    [reset, pulseUploadModal]
  );

  const onSubmit: SubmitHandler<FieldValues> = useCallback(
    async (values) => {
      try {
        await mutateAsync({
          title: values.title,
          genre: values.genre,
          musicFile: values.music?.[0] || null,
        });

        reset();
        setAudioPreview(null);
      } catch (error) {
        console.error("Pulse upload error:", error);
      }
    },
    [mutateAsync, reset]
  );

  return (
    <Modal
      title="Pulseを投稿"
      description="レトロな雰囲気の音声をPulseで共有しましょう！"
      isOpen={pulseUploadModal.isOpen}
      onChange={onChange}
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-y-4"
        aria-label="Pulse投稿"
      >
        <div className="flex items-center justify-center mb-2">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-theme-500/20 to-theme-600/10 border border-theme-500/20">
            <RiPulseLine className="w-10 h-10 text-theme-400" />
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="title" className="text-sm text-zinc-400">
            タイトル
          </label>
          <Input
            id="title"
            disabled={isLoading}
            {...register("title", { required: true })}
            placeholder="Pulseのタイトル"
            className="h-10 bg-zinc-800/50 border-zinc-700/50 focus:border-theme-500/50"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="genre" className="text-sm text-zinc-400">
            ジャンル
          </label>
          <Input
            id="genre"
            disabled={isLoading}
            {...register("genre", { required: true })}
            placeholder="例: Synthwave, Vaporwave, Lo-fi"
            className="h-10 bg-zinc-800/50 border-zinc-700/50 focus:border-theme-500/50"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="music" className="text-sm text-zinc-400">
            音声ファイル
          </label>
          <div className="relative p-4 border-2 border-dashed rounded-xl bg-zinc-800/30 border-zinc-700/50 hover:border-theme-500/30 transition-colors">
            <Input
              type="file"
              accept="audio/*"
              id="music"
              disabled={isLoading}
              onChange={onFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="text-center py-2">
              <p className="text-sm text-zinc-400">
                クリックまたはドラッグ&ドロップ
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                MP3, WAV, OGG などの音声ファイル
              </p>
            </div>
          </div>
        </div>

        {audioPreview && (
          <div className="p-3 rounded-xl bg-zinc-800/50 border border-zinc-700/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-theme-500/10">
                <RiPulseLine className="w-5 h-5 text-theme-400" />
              </div>
              <audio ref={audioRef} controls className="flex-1 h-8">
                <source src={audioPreview} type="audio/mpeg" />
              </audio>
            </div>
          </div>
        )}

        <Button
          disabled={isLoading}
          type="submit"
          className="mt-2 bg-gradient-to-r from-theme-500 to-theme-600 hover:from-theme-600 hover:to-theme-700 text-white font-medium py-3 rounded-xl transition-all duration-300 shadow-lg shadow-theme-500/20 hover:shadow-theme-500/40"
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
              <RiPulseLine className="w-5 h-5" />
              Pulseを投稿
            </span>
          )}
        </Button>
      </form>
    </Modal>
  );
});

PulseUploadModal.displayName = "PulseUploadModal";

export default PulseUploadModal;
