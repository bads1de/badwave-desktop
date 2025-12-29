/**
 * Electronの機能を利用するためのユーティリティ関数
 *
 * このファイルはNext.jsアプリケーションからElectronの機能を安全に利用するための
 * ヘルパー関数を提供します。Electronの環境でない場合は代替の実装を提供します。
 */

import { Song } from "@/types";

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
 * 現在の実行環境がElectronかどうかを判定
 *
 * 注意: Next.jsのSSRとCSRの間でハイドレーションエラーを防ぐため、
 * サーバーサイドでは常にfalseを返し、クライアントサイドでのみ実際の判定を行います。
 */
export const isElectron = (): boolean => {
  // サーバーサイドレンダリング時は常にfalseを返す
  if (typeof window === "undefined") {
    return false;
  }

  // クライアントサイドでのみElectronの存在を確認
  if (typeof (window as any).electron !== "undefined") {
    return (window as any).electron.appInfo.isElectron;
  }

  return false;
};

/**
 * アプリケーションのバージョンを取得
 *
 * 注意: Next.jsのSSRとCSRの間でハイドレーションエラーを防ぐため、
 * サーバーサイドでは常にデフォルト値を返し、クライアントサイドでのみ実際の判定を行います。
 */
export const getAppVersion = (): string => {
  // サーバーサイドレンダリング時は常にデフォルト値を返す
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_APP_VERSION || "0.0.0";
  }

  // クライアントサイドでElectronが利用可能な場合はバージョン情報を取得
  if (typeof (window as any).electron !== "undefined") {
    return (window as any).electron.appInfo.getVersion();
  }

  return process.env.NEXT_PUBLIC_APP_VERSION || "0.0.0";
};

/**
 * 実行プラットフォームを取得
 *
 * 注意: Next.jsのSSRとCSRの間でハイドレーションエラーを防ぐため、
 * サーバーサイドでは常に"web"を返し、クライアントサイドでのみ実際の判定を行います。
 */
export const getPlatform = (): string => {
  // サーバーサイドレンダリング時は常に"web"を返す
  if (typeof window === "undefined") {
    return "web";
  }

  // クライアントサイドでElectronが利用可能な場合はプラットフォーム情報を取得
  if (typeof (window as any).electron !== "undefined") {
    return (window as any).electron.appInfo.platform;
  }

  return "web";
};

/**
 * ウィンドウ操作
 */
export const windowControls = {
  minimize: (): Promise<void> => {
    if (isElectron()) {
      return (window as any).electron.window.minimize();
    }
    return Promise.resolve();
  },

  maximize: (): Promise<void> => {
    if (isElectron()) {
      return (window as any).electron.window.maximize();
    }
    return Promise.resolve();
  },

  close: (): Promise<void> => {
    if (isElectron()) {
      return (window as any).electron.window.close();
    }
    return Promise.resolve();
  },
};

/**
 * 設定ストア操作
 */
export const store = {
  get: async <T>(key: string, defaultValue?: T): Promise<T> => {
    if (isElectron()) {
      const value = await (window as any).electron.store.get(key);
      return value !== undefined ? value : (defaultValue as T);
    }

    // Electronでない場合はローカルストレージを使用
    if (typeof window !== "undefined" && window.localStorage) {
      const item = localStorage.getItem(key);
      if (item !== null) {
        try {
          return JSON.parse(item) as T;
        } catch (e) {
          console.error(`Error parsing localStorage item ${key}:`, e);
        }
      }
    }

    return defaultValue as T;
  },

  set: async <T>(key: string, value: T): Promise<boolean> => {
    if (isElectron()) {
      return (window as any).electron.store.set(key, value);
    }

    // Electronでない場合はローカルストレージを使用
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (e) {
        console.error(`Error setting localStorage item ${key}:`, e);
        return false;
      }
    }

    return false;
  },
};

/**
 * メディア制御
 */
export const mediaControls = {
  onMediaControl: (callback: (action: string) => void): (() => void) => {
    if (isElectron()) {
      return (window as any).electron.media.onMediaControl(callback);
    }

    // Electronでない場合は空の関数を返す
    return () => {};
  },
};

/**
 * IPC通信
 */
export const ipc = {
  invoke: async <T = any>(channel: string, ...args: any[]): Promise<T> => {
    if (isElectron()) {
      return (window as any).electron.ipc.invoke(channel, ...args);
    }

    console.warn(`IPC invoke called in non-Electron environment: ${channel}`);
    return Promise.reject(new Error("Not in Electron environment"));
  },

  on: <T = any>(
    channel: string,
    callback: (...args: T[]) => void
  ): (() => void) => {
    if (isElectron()) {
      return (window as any).electron.ipc.on(channel, callback);
    }

    // Electronでない場合は空の関数を返す
    return () => {};
  },

  send: (channel: string, ...args: any[]): void => {
    if (isElectron()) {
      (window as any).electron.ipc.send(channel, ...args);
    } else {
      console.warn(`IPC send called in non-Electron environment: ${channel}`);
    }
  },
};

/**
 * Electronの機能をまとめたオブジェクト
 */
export const electronAPI = {
  isElectron,
  getAppVersion,
  getPlatform,
  windowControls,
  store,
  mediaControls,
  ipc,
  offline: {
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
  },

  // 開発用ユーティリティ
  dev: {
    /**
     * オフラインモードのシミュレーションを切り替え（トグル）
     * 開発時にネットワーク接続なしでオフライン機能をテストするために使用
     */
    toggleOfflineSimulation: async (): Promise<{ isOffline: boolean }> => {
      if (isElectron()) {
        return (window as any).electron.dev.toggleOfflineSimulation();
      }
      console.warn("Offline simulation is only available in Electron");
      return { isOffline: false };
    },

    /**
     * 現在のオフラインシミュレーション状態を取得
     */
    getOfflineSimulationStatus: async (): Promise<{ isOffline: boolean }> => {
      if (isElectron()) {
        return (window as any).electron.dev.getOfflineSimulationStatus();
      }
      return { isOffline: false };
    },

    /**
     * オフラインシミュレーションを明示的に ON/OFF
     * @param offline - trueでオフラインモードをシミュレート
     */
    setOfflineSimulation: async (
      offline: boolean
    ): Promise<{ isOffline: boolean }> => {
      if (isElectron()) {
        return (window as any).electron.dev.setOfflineSimulation(offline);
      }
      console.warn("Offline simulation is only available in Electron");
      return { isOffline: false };
    },
  },

  // キャッシュ機能（オフラインライブラリ表示用）
  cache: {
    /**
     * 曲のメタデータをローカルDBにキャッシュ
     * ダウンロード状態は上書きしない
     */
    syncSongsMetadata: async (
      songs: any[]
    ): Promise<{ success: boolean; count: number; error?: string }> => {
      if (isElectron()) {
        return (window as any).electron.cache.syncSongsMetadata(songs);
      }
      return { success: false, count: 0, error: "Not in Electron environment" };
    },

    /**
     * プレイリストをローカルDBにキャッシュ
     */
    syncPlaylists: async (
      playlists: any[]
    ): Promise<{ success: boolean; count: number; error?: string }> => {
      if (isElectron()) {
        return (window as any).electron.cache.syncPlaylists(playlists);
      }
      return { success: false, count: 0, error: "Not in Electron environment" };
    },

    /**
     * プレイリスト内の曲をローカルDBにキャッシュ（メタデータも同期）
     */
    syncPlaylistSongs: async (data: {
      playlistId: string;
      songs: any[];
    }): Promise<{ success: boolean; count: number; error?: string }> => {
      if (isElectron()) {
        return (window as any).electron.cache.syncPlaylistSongs(data);
      }
      return { success: false, count: 0, error: "Not in Electron environment" };
    },

    /**
     * いいねした曲をローカルDBにキャッシュ（メタデータも同期）
     */
    syncLikedSongs: async (data: {
      userId: string;
      songs: any[];
    }): Promise<{ success: boolean; count: number; error?: string }> => {
      if (isElectron()) {
        return (window as any).electron.cache.syncLikedSongs(data);
      }
      return { success: false, count: 0, error: "Not in Electron environment" };
    },

    /**
     * キャッシュからプレイリストを取得
     */
    getCachedPlaylists: async (userId: string): Promise<any[]> => {
      if (isElectron()) {
        return (window as any).electron.cache.getCachedPlaylists(userId);
      }
      return [];
    },

    /**
     * キャッシュからいいね曲を取得（ダウンロード状態付き）
     */
    getCachedLikedSongs: async (userId: string): Promise<any[]> => {
      if (isElectron()) {
        return (window as any).electron.cache.getCachedLikedSongs(userId);
      }
      return [];
    },

    /**
     * キャッシュからプレイリスト内の曲を取得（ダウンロード状態付き）
     */
    getCachedPlaylistSongs: async (playlistId: string): Promise<any[]> => {
      if (isElectron()) {
        return (window as any).electron.cache.getCachedPlaylistSongs(
          playlistId
        );
      }
      return [];
    },
  },

  // 認証キャッシュ（オフラインログイン用）
  auth: {
    /**
     * ユーザー情報をローカルに保存
     */
    saveCachedUser: async (user: {
      id: string;
      email?: string;
      avatarUrl?: string;
    }): Promise<{ success: boolean }> => {
      if (isElectron()) {
        return (window as any).electron.auth.saveCachedUser(user);
      }
      return { success: false };
    },

    /**
     * ローカルに保存されたユーザー情報を取得
     */
    getCachedUser: async (): Promise<{
      id: string;
      email?: string;
      avatarUrl?: string;
    } | null> => {
      if (isElectron()) {
        return (window as any).electron.auth.getCachedUser();
      }
      return null;
    },

    /**
     * ローカルのユーザー情報をクリア
     */
    clearCachedUser: async (): Promise<{ success: boolean }> => {
      if (isElectron()) {
        return (window as any).electron.auth.clearCachedUser();
      }
      return { success: false };
    },
  },
};
