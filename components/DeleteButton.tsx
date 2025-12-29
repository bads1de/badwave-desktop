"use client";
import React from "react";

import { HiTrash } from "react-icons/hi";
import { twMerge } from "tailwind-merge";
import useDeleteSongMutation from "@/hooks/mutations/useDeleteSongMutation";

interface DeleteButtonProps {
  songId: string;
  className?: string;
}

const DeleteButton: React.FC<DeleteButtonProps> = ({ songId, className }) => {
  const deleteMutation = useDeleteSongMutation();

  const handleDelete = () => {
    if (deleteMutation.isPending) return;

    deleteMutation.mutate({ songId });
  };

  return (
    <button
      className={twMerge(
        `
        group
        relative
        rounded-full
        p-2
        hover:bg-red-500/10
        transition-all
        duration-300
        focus:outline-none
      `,
        className
      )}
      onClick={handleDelete}
      disabled={deleteMutation.isPending}
    >
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-red-500/10 to-red-900/10 opacity-0 group-hover:opacity-100 transition-all duration-300" />
      <HiTrash
        className="text-neutral-400 group-hover:text-red-500 transition-colors duration-300 transform group-hover:scale-110"
        size={20}
      />
    </button>
  );
};

// displayName を設定
DeleteButton.displayName = "DeleteButton";

export default DeleteButton;
