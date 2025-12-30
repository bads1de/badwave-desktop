"use client";

import React from "react";
import { HiDownload, HiTrash } from "react-icons/hi";
import useBulkDownload from "@/hooks/downloads/useBulkDownload";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";
import { Song } from "@/types";
import { electronAPI } from "@/libs/electron";
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
  const { isOnline } = useNetworkStatus();

  // Electron 環境でない場合は表示しない
  if (!electronAPI.isElectron()) {
    return null;
  }

  // オフライン時は「ダウンロード」ボタンを隠す（削除ボタンのみ許可）
  if (!isOnline && !isAllDownloaded) {
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
    ? "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.1)] hover:shadow-[0_0_25px_rgba(239,68,68,0.2)]"
    : "bg-theme-500 text-white shadow-[0_0_20px_rgba(var(--theme-500),0.3)] hover:shadow-[0_0_30px_rgba(var(--theme-500),0.5)] hover:bg-theme-400 border border-theme-400/20";

  return (
    <button
      onClick={handleClick}
      disabled={songs.length === 0}
      className={`
        flex items-center justify-center gap-2.5 px-6 py-2.5 rounded-full
        ${buttonStyle}
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-300
        font-bold text-sm tracking-wide
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
                strokeWidth="3"
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
          <span className="text-[10px] opacity-60 font-medium">
            ({isDownloading ? downloadedCount : progress}% /{" "}
            {totalCount || songs.length})
          </span>
        </>
      ) : isAllDownloaded ? (
        <>
          <HiTrash className="w-4 h-4 transition-transform group-hover:scale-110" />
          <span>{deleteLabel}</span>
          <span className="text-[10px] opacity-60 font-medium">
            ({songs.length}曲)
          </span>
        </>
      ) : (
        <>
          <HiDownload className="w-4 h-4 transition-transform group-hover:translate-y-0.5" />
          <span>{downloadLabel}</span>
          {songs.length > 0 && (
            <span className="text-[10px] opacity-60 font-medium">
              ({downloadedSongsCount} / {songs.length}曲)
            </span>
          )}
        </>
      )}
    </button>
  );
};

export default BulkDownloadButton;
