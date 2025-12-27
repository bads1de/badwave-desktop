"use client";

import { useState, useEffect, useCallback } from "react";
import { Song } from "@/types";
import toast from "react-hot-toast";

import { getDownloadFilename } from "@/libs/songUtils";
import { electronAPI } from "@/libs/electron-utils";

interface UseDownloadSongResult {
  download: () => Promise<void>;
  remove: () => Promise<void>;
  isDownloading: boolean;
  isDownloaded: boolean;
  error: string | null;
}

/**
 * 曲のダウンロード機能を管理するフック
 * @param song 対象の曲オブジェクト
 */
const useDownloadSong = (song: Song | null): UseDownloadSongResult => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getFilename = useCallback(() => {
    if (!song) return "";
    return getDownloadFilename(song);
  }, [song]);

  /**
   * ダウンロード済みかどうかを確認
   */
  const checkStatus = useCallback(async () => {
    if (!song || !electronAPI.isElectron()) return;

    try {
      const filename = getFilename();
      const exists = await electronAPI.downloader.checkFileExists(filename);
      setIsDownloaded(exists);
    } catch (err) {
      console.error("Failed to check file status:", err);
    }
  }, [song, getFilename]);

  // マウント時と曲変更時にステータスを確認
  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  /**
   * ダウンロードを実行
   */
  const download = async () => {
    if (!song || !song.song_path || isDownloaded) return;

    setIsDownloading(true);
    setError(null);

    try {
      if (!electronAPI.isElectron()) {
        throw new Error(
          "ダウンロード機能が利用できません（Electron APIが見つかりません）"
        );
      }

      const filename = getFilename();
      await electronAPI.downloader.downloadSong(song.song_path, filename);

      setIsDownloaded(true);
      toast.success("ダウンロードが完了しました");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "ダウンロード中にエラーが発生しました";
      setError(message);
      toast.error(message);
      console.error(err);
      throw err; // テストでの検証用に再スロー
    } finally {
      setIsDownloading(false);
    }
  };

  /**
   * ダウンロード済みファイルを削除
   */
  const remove = async () => {
    if (!song || !isDownloaded) return;

    try {
      if (!electronAPI.isElectron()) {
        throw new Error("Electron APIが見つかりません");
      }

      const filename = getFilename();
      const result = await electronAPI.downloader.deleteSong(filename);

      if (result) {
        setIsDownloaded(false);
        toast.success("キャッシュから削除しました");
      } else {
        throw new Error("削除に失敗しました");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "削除中にエラーが発生しました";
      toast.error(message);
      console.error(err);
    }
  };

  return {
    download,
    remove,
    isDownloading,
    isDownloaded,
    error,
  };
};

export default useDownloadSong;
