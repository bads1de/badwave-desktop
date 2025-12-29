"use client";

import usePlaylistModal from "@/hooks/modal/usePlaylistModal";
import { useUser } from "@/hooks/auth/useUser";
import React from "react";
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import Modal from "./Modal";
import Input from "../common/Input";
import Button from "../common/Button";
import useCreatePlaylistMutation from "@/hooks/mutations/useCreatePlaylistMutation";

const PlaylistModal = () => {
  const playlistModal = usePlaylistModal();

  // TanStack Queryを使用したミューテーション
  const { mutateAsync, isPending: isLoading } =
    useCreatePlaylistMutation(playlistModal);

  const { register, handleSubmit, reset } = useForm<FieldValues>({
    defaultValues: {
      title: "",
    },
  });

  const onChange = (open: boolean) => {
    if (!open) {
      reset();
      playlistModal.onClose();
    }
  };

  const onSubmit: SubmitHandler<FieldValues> = async (values) => {
    try {
      // TanStack Queryのミューテーションを使用
      await mutateAsync({
        title: values.title,
      });

      // 成功時の処理はミューテーションのonSuccessで行われる
    } catch (error) {
      // エラー処理はミューテーション内で行われる
      console.error("Create playlist error:", error);
    }
  };

  return (
    <Modal
      title="プレイリストを作成"
      description="プレイリストのタイトルを入力してください"
      isOpen={playlistModal.isOpen}
      onChange={onChange}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-y-4">
        <Input
          id="title"
          disabled={isLoading}
          {...register("title", { required: true })}
          placeholder="プレイリスト名"
        />
        <Button disabled={isLoading} type="submit">
          {isLoading ? "作成中" : "作成"}
        </Button>
      </form>
    </Modal>
  );
};

export default PlaylistModal;
