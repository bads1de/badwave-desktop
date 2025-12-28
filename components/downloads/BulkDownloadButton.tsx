"use client";

import React from "react";
import { HiDownload, HiTrash } from "react-icons/hi";
import useBulkDownload from "@/hooks/downloads/useBulkDownload";
import { Song } from "@/types";
import { electronAPI } from "@/libs/electron-utils";
import { toast } from "react-hot-toast";

interface BulkDownloadButtonProps {
  songs: Song[];
  downloadLabel?: string;
  deleteLabel?: string;
  className?: string;
}

/**
 * 一括ダウンロード/削除トグルボタン
 *
 * - 未ダウンロード時: ダウンロードボタン
 * - 全曲ダウンロード済み: 削除ボタン
 */
const BulkDownloadButton: React.FC<BulkDownloadButtonProps> = ({
  songs,
  downloadLabel = "全曲をダウンロード",
  deleteLabel = "ダウンロードを削除",
  className = "",
}) => {
  const {
    isDownloading,
    isDeleting,
    progress,
    downloadedCount,
    totalCount,
    currentSong,
    isAllDownloaded,
    downloadedSongsCount,
    downloadAll,
    deleteAll,
    cancel,
  } = useBulkDownload(songs);

  // Electron 環境でない場合は表示しない
  if (!electronAPI.isElectron()) {
    return null;
  }

  const isProcessing = isDownloading || isDeleting;

  const handleClick = async () => {
    if (isProcessing) {
      cancel();
      toast("処理をキャンセルしました");
      return;
    }

    if (songs.length === 0) {
      toast.error("曲がありません");
      return;
    }

    if (isAllDownloaded) {
      // 削除モード
      const confirmed = window.confirm(
        `${songs.length} 曲のダウンロードデータを削除しますか？`
      );
      if (!confirmed) return;

      toast(`${songs.length} 曲の削除を開始します...`);
      const result = await deleteAll();

      if (result) {
        if (result.errors.length > 0) {
          toast.error(`${result.errors.length} 曲の削除に失敗しました`);
        } else {
          toast.success(`${result.deletedCount} 曲を削除しました`);
        }
      }
    } else {
      // ダウンロードモード
      const remaining = songs.length - downloadedSongsCount;
      toast(`${remaining} 曲のダウンロードを開始します...`);
      const result = await downloadAll();

      if (result) {
        if (result.errors.length > 0) {
          toast.error(`${result.errors.length} 曲のダウンロードに失敗しました`);
        } else {
          toast.success(`${result.downloadedCount} 曲をダウンロードしました`);
        }
      }
    }
  };

  // ボタンのスタイルを状態に応じて変更
  const buttonStyle = isAllDownloaded
    ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500"
    : "bg-gradient-to-r from-theme-500 to-theme-600 hover:from-theme-400 hover:to-theme-500";

  return (
    <button
      onClick={handleClick}
      disabled={songs.length === 0}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-full
        ${buttonStyle}
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-200
        text-white font-medium text-sm
        ${isProcessing ? "animate-pulse" : ""}
        ${className}
      `}
    >
      {isProcessing ? (
        <>
          <div className="relative w-5 h-5">
            <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
          <span className="truncate max-w-[150px]">
            {currentSong || `${progress}%`}
          </span>
          <span className="text-xs opacity-70">
            ({isDownloading ? downloadedCount : progress}%/
            {totalCount || songs.length})
          </span>
        </>
      ) : isAllDownloaded ? (
        <>
          <HiTrash className="w-5 h-5" />
          <span>{deleteLabel}</span>
          <span className="text-xs opacity-70">({songs.length}曲)</span>
        </>
      ) : (
        <>
          <HiDownload className="w-5 h-5" />
          <span>{downloadLabel}</span>
          {songs.length > 0 && (
            <span className="text-xs opacity-70">
              ({downloadedSongsCount}/{songs.length}曲)
            </span>
          )}
        </>
      )}
    </button>
  );
};

export default BulkDownloadButton;
