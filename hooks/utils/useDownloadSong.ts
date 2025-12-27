"use client";

import { useState, useEffect, useCallback } from "react";
import { Song } from "@/types";
import toast from "react-hot-toast";

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
 *
 * Phase 2で実装したオフラインIPCを使用し、曲のダウンロードとDBへの保存を行います。
 *
 * @param song 対象の曲オブジェクト
 */
const useDownloadSong = (song: Song | null): UseDownloadSongResult => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * ダウンロード済みかどうかを確認
   * 新しいオフラインIPCを使用してDBからステータスを取得
   */
  const checkStatus = useCallback(async () => {
    if (!song || !electronAPI.isElectron()) return;

    try {
      const { isDownloaded } = await electronAPI.offline.checkStatus(song.id);
      setIsDownloaded(isDownloaded);
    } catch (err) {
      console.error("Failed to check offline status:", err);
    }
  }, [song]);

  // マウント時と曲変更時にステータスを確認
  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  /**
   * ダウンロードを実行
   * 新しいオフラインIPCを使用してファイルをダウンロードし、DBに保存
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

      // SongDownloadPayload形式に変換
      const payload = {
        id: song.id,
        userId: song.user_id,
        title: song.title,
        author: song.author,
        song_path: song.song_path,
        image_path: song.image_path,
        duration: song.duration,
        genre: song.genre,
        lyrics: song.lyrics,
        created_at: song.created_at,
      };

      const result = await electronAPI.offline.downloadSong(payload);

      if (result.success) {
        setIsDownloaded(true);
        toast.success("ダウンロードが完了しました");
      } else {
        throw new Error(result.error || "ダウンロードに失敗しました");
      }
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
   * 新しいオフラインIPCを使用してファイルとDBレコードの両方を削除
   */
  const remove = async () => {
    if (!song || !isDownloaded) return;

    try {
      if (!electronAPI.isElectron()) {
        throw new Error("Electron APIが見つかりません");
      }

      const result = await electronAPI.offline.deleteSong(song.id);

      if (result.success) {
        setIsDownloaded(false);
        toast.success("オフラインデータを削除しました");
      } else {
        throw new Error(result.error || "削除に失敗しました");
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
