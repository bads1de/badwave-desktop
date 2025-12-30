import { isElectron } from "./common";

// オフライン曲の型定義
export interface OfflineSong {
  id: string;
  user_id: string;
  title: string;
  author: string;
  song_path: string; // ローカルファイルパス (file://...)
  image_path: string | null;
  original_song_path: string | null;
  original_image_path: string | null;
  duration: number | null;
  genre: string | null;
  lyrics: string | null;
  created_at: string | null;
  downloaded_at: Date | null;
}

// ダウンロード時に渡される曲データの型定義
export interface SongDownloadPayload {
  id: string;
  userId: string;
  title: string;
  author: string;
  song_path: string; // リモートURL
  image_path: string; // リモートURL
  duration?: number;
  genre?: string;
  lyrics?: string;
  created_at: string;
}

/**
 * オフライン機能（ダウンロード管理など）
 */
export const offline = {
  getSongs: async (): Promise<OfflineSong[]> => {
    if (isElectron()) {
      return (window as any).electron.offline.getSongs();
    }
    return [];
  },
  checkStatus: async (
    songId: string
  ): Promise<{
    isDownloaded: boolean;
    localPath?: string;
    localImagePath?: string;
  }> => {
    if (isElectron()) {
      return (window as any).electron.offline.checkStatus(songId);
    }
    return { isDownloaded: false };
  },
  deleteSong: async (
    songId: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (isElectron()) {
      return (window as any).electron.offline.deleteSong(songId);
    }
    return { success: false, error: "Not in Electron environment" };
  },
  downloadSong: async (
    song: SongDownloadPayload
  ): Promise<{ success: boolean; localPath?: string; error?: string }> => {
    if (isElectron()) {
      return (window as any).electron.offline.downloadSong(song);
    }
    return { success: false, error: "Not in Electron environment" };
  },
};
