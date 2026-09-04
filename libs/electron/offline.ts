import { isElectron } from "./common";
import type { OfflineSong, SongDownloadPayload } from "@/types/local";

export type { OfflineSong, SongDownloadPayload };

/**
 * オフライン機能（ダウンロード管理など）
 */
export const offline = {
  getSongs: async (): Promise<OfflineSong[]> => {
    if (isElectron()) {
      return window.electron.offline.getSongs();
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
      return window.electron.offline.checkStatus(songId);
    }
    return { isDownloaded: false };
  },
  deleteSong: async (
    songId: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (isElectron()) {
      return window.electron.offline.deleteSong(songId);
    }
    return { success: false, error: "Not in Electron environment" };
  },
  downloadSong: async (
    song: SongDownloadPayload
  ): Promise<{ success: boolean; localPath?: string; error?: string }> => {
    if (isElectron()) {
      return window.electron.offline.downloadSong(song);
    }
    return { success: false, error: "Not in Electron environment" };
  },
};
