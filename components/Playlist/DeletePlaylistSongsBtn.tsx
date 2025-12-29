"use client";

import React from "react";
import { RiDeleteBin5Line } from "react-icons/ri";
import useMutatePlaylistSong from "@/hooks/mutations/useMutatePlaylistSong";

interface DeletePlaylistSongsBtnProps {
  songId: string;
  playlistId: string;
  showText?: boolean;
  disabled?: boolean;
}

/**
 * プレイリストから曲を削除するボタンコンポーネント
 *
 * @param songId 削除する曲のID
 * @param playlistId 対象のプレイリストID
 * @param showText テキストを表示するかどうか
 * @param disabled ボタンを無効化するかどうか
 */
const DeletePlaylistSongsBtn: React.FC<DeletePlaylistSongsBtnProps> = ({
  songId,
  playlistId,
  showText = false,
  disabled = false,
}) => {
  // プレイリスト曲の削除ミューテーションを取得
  const { deletePlaylistSong } = useMutatePlaylistSong();

  // 削除ハンドラー
  const handleDeletePlaylistSongs = () => {
    deletePlaylistSong.mutate({ songId, playlistId });
  };

  return (
    <button
      className={`w-full flex items-center transition-all duration-300 ${
        disabled
          ? "text-neutral-600 cursor-not-allowed opacity-50"
          : "text-neutral-400 cursor-pointer hover:text-red-500 hover:filter hover:drop-shadow-[0_0_8px_rgba(255,0,0,0.8)]"
      }`}
      disabled={deletePlaylistSong.isPending || disabled}
      onClick={!disabled ? handleDeletePlaylistSongs : undefined}
    >
      <RiDeleteBin5Line size={28} className="mr-2" />
      {showText && <span className="text-sm font-semibold">削除</span>}
    </button>
  );
};

export default DeletePlaylistSongsBtn;
