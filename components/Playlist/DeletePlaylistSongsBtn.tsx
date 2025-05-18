"use client";

import React from "react";
import { RiDeleteBin5Line } from "react-icons/ri";
import useMutatePlaylistSong from "@/hooks/data/useMutatePlaylistSong";

interface DeletePlaylistSongsBtnProps {
  songId: string;
  playlistId: string;
  showText?: boolean;
}

/**
 * プレイリストから曲を削除するボタンコンポーネント
 *
 * @param songId 削除する曲のID
 * @param playlistId 対象のプレイリストID
 * @param showText テキストを表示するかどうか
 */
const DeletePlaylistSongsBtn: React.FC<DeletePlaylistSongsBtnProps> = ({
  songId,
  playlistId,
  showText = false,
}) => {
  // プレイリスト曲の削除ミューテーションを取得
  const { deletePlaylistSong } = useMutatePlaylistSong();

  // 削除ハンドラー
  const handleDeletePlaylistSongs = () => {
    deletePlaylistSong.mutate({ songId, playlistId });
  };

  return (
    <button
      className="w-full flex items-center text-neutral-400 cursor-pointer hover:text-red-500 hover:filter hover:drop-shadow-[0_0_8px_rgba(255,0,0,0.8)] transition-all duration-300"
      disabled={deletePlaylistSong.isPending}
      onClick={handleDeletePlaylistSongs}
    >
      <RiDeleteBin5Line size={28} className="mr-2" />
      {showText && <span className="text-sm font-semibold">削除</span>}
    </button>
  );
};

export default DeletePlaylistSongsBtn;
