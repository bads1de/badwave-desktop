import { useState, useCallback, useEffect } from "react";
import { Song } from "@/types";
import { electronAPI } from "@/libs/electron-utils";

interface BulkDownloadState {
  isDownloading: boolean;
  isDeleting: boolean;
  progress: number; // 0-100
  downloadedCount: number;
  totalCount: number;
  currentSong: string | null;
  errors: string[];
  /** 全曲ダウンロード済みか */
  isAllDownloaded: boolean;
  /** ダウンロード済みの曲数 */
  downloadedSongsCount: number;
}

/**
 * 複数の曲を一括でダウンロード/削除するフック
 */
const useBulkDownload = (songs: Song[] = []) => {
  const [state, setState] = useState<BulkDownloadState>({
    isDownloading: false,
    isDeleting: false,
    progress: 0,
    downloadedCount: 0,
    totalCount: 0,
    currentSong: null,
    errors: [],
    isAllDownloaded: false,
    downloadedSongsCount: 0,
  });

  /**
   * 曲のダウンロード状態を確認
   */
  const checkDownloadStatus = useCallback(async (songId: string) => {
    if (!electronAPI.isElectron()) return { isDownloaded: false };
    try {
      return await (window as any).electron.offline.checkStatus(songId);
    } catch {
      return { isDownloaded: false };
    }
  }, []);

  /**
   * 全曲のダウンロード状態をチェック
   */
  const checkAllDownloadStatus = useCallback(async () => {
    if (!electronAPI.isElectron() || songs.length === 0) {
      setState((prev) => ({
        ...prev,
        isAllDownloaded: false,
        downloadedSongsCount: 0,
      }));
      return;
    }

    let downloadedCount = 0;
    for (const song of songs) {
      const status = await checkDownloadStatus(String(song.id));
      if (status.isDownloaded) {
        downloadedCount++;
      }
    }

    setState((prev) => ({
      ...prev,
      isAllDownloaded: downloadedCount === songs.length && songs.length > 0,
      downloadedSongsCount: downloadedCount,
    }));
  }, [songs, checkDownloadStatus]);

  // songs が変更されたらダウンロード状態をチェック
  useEffect(() => {
    checkAllDownloadStatus();
  }, [checkAllDownloadStatus]);

  /**
   * 単一の曲をダウンロード
   */
  const downloadSingle = useCallback(async (song: Song) => {
    if (!electronAPI.isElectron()) return false;
    try {
      const result = await (window as any).electron.offline.downloadSong({
        id: String(song.id),
        userId: song.user_id,
        song_path: song.song_path,
        image_path: song.image_path,
        title: song.title,
        author: song.author,
        duration: song.duration,
        genre: song.genre,
        lyrics: song.lyrics,
        created_at: song.created_at,
      });
      return result.success;
    } catch (e) {
      console.error(`Failed to download ${song.title}:`, e);
      return false;
    }
  }, []);

  /**
   * 単一の曲を削除
   */
  const deleteSingle = useCallback(async (songId: string) => {
    if (!electronAPI.isElectron()) return false;
    try {
      const result = await (window as any).electron.offline.deleteSong(songId);
      return result.success;
    } catch (e) {
      console.error(`Failed to delete song ${songId}:`, e);
      return false;
    }
  }, []);

  /**
   * 複数の曲を一括ダウンロード
   */
  const downloadAll = useCallback(async () => {
    if (!electronAPI.isElectron() || songs.length === 0) return;

    setState((prev) => ({
      ...prev,
      isDownloading: true,
      progress: 0,
      downloadedCount: 0,
      totalCount: songs.length,
      currentSong: null,
      errors: [],
    }));

    const errors: string[] = [];
    let downloadedCount = 0;

    for (let i = 0; i < songs.length; i++) {
      const song = songs[i];

      setState((prev) => ({
        ...prev,
        currentSong: song.title,
        progress: Math.round((i / songs.length) * 100),
      }));

      // 既にダウンロード済みかチェック
      const status = await checkDownloadStatus(String(song.id));
      if (status.isDownloaded) {
        downloadedCount++;
        setState((prev) => ({ ...prev, downloadedCount }));
        continue;
      }

      // ダウンロード実行
      const success = await downloadSingle(song);
      if (success) {
        downloadedCount++;
      } else {
        errors.push(song.title);
      }

      setState((prev) => ({
        ...prev,
        downloadedCount,
        progress: Math.round(((i + 1) / songs.length) * 100),
      }));
    }

    setState((prev) => ({
      ...prev,
      isDownloading: false,
      progress: 100,
      currentSong: null,
      errors,
      isAllDownloaded: downloadedCount === songs.length,
      downloadedSongsCount: downloadedCount,
    }));

    return { downloadedCount, errors };
  }, [songs, checkDownloadStatus, downloadSingle]);

  /**
   * 複数の曲を一括削除
   */
  const deleteAll = useCallback(async () => {
    if (!electronAPI.isElectron() || songs.length === 0) return;

    setState((prev) => ({
      ...prev,
      isDeleting: true,
      progress: 0,
      currentSong: null,
      errors: [],
    }));

    const errors: string[] = [];
    let deletedCount = 0;

    for (let i = 0; i < songs.length; i++) {
      const song = songs[i];

      setState((prev) => ({
        ...prev,
        currentSong: song.title,
        progress: Math.round((i / songs.length) * 100),
      }));

      // ダウンロード済みかチェック
      const status = await checkDownloadStatus(String(song.id));
      if (!status.isDownloaded) {
        continue;
      }

      // 削除実行
      const success = await deleteSingle(String(song.id));
      if (success) {
        deletedCount++;
      } else {
        errors.push(song.title);
      }

      setState((prev) => ({
        ...prev,
        progress: Math.round(((i + 1) / songs.length) * 100),
      }));
    }

    setState((prev) => ({
      ...prev,
      isDeleting: false,
      progress: 100,
      currentSong: null,
      errors,
      isAllDownloaded: false,
      downloadedSongsCount: 0,
    }));

    return { deletedCount, errors };
  }, [songs, checkDownloadStatus, deleteSingle]);

  /**
   * キャンセル
   */
  const cancel = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isDownloading: false,
      isDeleting: false,
      currentSong: null,
    }));
  }, []);

  /**
   * 状態を再チェック
   */
  const refresh = useCallback(() => {
    checkAllDownloadStatus();
  }, [checkAllDownloadStatus]);

  return {
    ...state,
    downloadAll,
    deleteAll,
    cancel,
    refresh,
  };
};

export default useBulkDownload;
