import { contextBridge, ipcRenderer } from "electron";

// チャンネル検証用の共通関数
function validateChannel(channel: string, allowedChannels: string[]): boolean {
  if (!allowedChannels.includes(channel)) {
    throw new Error(
      `Channel "${channel}" is not allowed for security reasons.`
    );
  }
  return true;
}

// 許可されたチャンネルのリスト
const ALLOWED_INVOKE_CHANNELS = [
  "get-store-value",
  "set-store-value",
  "window-minimize",
  "window-maximize",
  "window-close",
  "api-request",
  "handle-select-directory",
  "handle-scan-mp3-files",
  "handle-get-mp3-metadata",
  "handle-get-saved-music-library",
  "download-song",
  "check-file-exists",
  "get-local-file-path",
  "delete-song",
  // Phase 2: Offline handlers
  "get-offline-songs",
  "delete-offline-song",
  "check-offline-status",
  // 開発用: オフラインシミュレーション
  "toggle-offline-simulation",
  "get-offline-simulation-status",
  "set-offline-simulation",
  // キャッシュハンドラー（オフラインライブラリ表示用）
  "sync-songs-metadata",
  "sync-playlists",
  "sync-playlist-songs",
  "sync-liked-songs",
  "sync-spotlights-metadata",
  "sync-section",
  "get-section-data",
  "get-cached-playlists",
  "get-cached-liked-songs",
  "get-cached-playlist-songs",
  "debug-dump-db",
  // Local-first mutation handlers
  "add-liked-song",
  "remove-liked-song",
  "get-like-status",
  "add-playlist-song",
  "remove-playlist-song",
  // 認証キャッシュ
  "save-cached-user",
  "get-cached-user",
  "clear-cached-user",
];

const ALLOWED_ON_CHANNELS = [
  "media-control",
  "download-progress",
  "offline-simulation-changed",
];

const ALLOWED_SEND_CHANNELS = ["log", "player-state-change"];

// Electronの機能をウィンドウオブジェクトに安全に公開
contextBridge.exposeInMainWorld("electron", {
  // アプリケーション情報
  appInfo: {
    getVersion: () => process.env.npm_package_version,
    isElectron: true,
    platform: process.platform,
  },

  // ウィンドウ操作
  window: {
    minimize: () => ipcRenderer.invoke("window-minimize"),
    maximize: () => ipcRenderer.invoke("window-maximize"),
    close: () => ipcRenderer.invoke("window-close"),
  },

  // 設定ストア操作
  store: {
    get: (key: string) => ipcRenderer.invoke("get-store-value", key),
    set: (key: string, value: any) =>
      ipcRenderer.invoke("set-store-value", key, value),
  },

  // メディア制御
  media: {
    // メディア制御イベントのリスナーを登録
    onMediaControl: (callback: (action: string) => void) => {
      const subscription = (_: any, action: string) => callback(action);
      ipcRenderer.on("media-control", subscription);

      // リスナーの登録解除関数を返す
      return () => {
        ipcRenderer.removeListener("media-control", subscription);
      };
    },
  },

  // オフライン機能 (Phase 2)
  offline: {
    // オフライン（ダウンロード済み）の曲を全て取得
    getSongs: () => ipcRenderer.invoke("get-offline-songs"),
    // 曲がダウンロード済みかチェック
    checkStatus: (songId: string) =>
      ipcRenderer.invoke("check-offline-status", songId),
    // オフライン曲を削除（ファイル + DB）
    deleteSong: (songId: string) =>
      ipcRenderer.invoke("delete-offline-song", songId),
    // 曲をダウンロード（メタデータ付き）
    downloadSong: (song: any) => ipcRenderer.invoke("download-song", song),
  },

  // 開発用ユーティリティ
  dev: {
    // オフラインシミュレーションを切り替え
    toggleOfflineSimulation: () =>
      ipcRenderer.invoke("toggle-offline-simulation"),
    // 現在のオフラインシミュレーション状態を取得
    getOfflineSimulationStatus: () =>
      ipcRenderer.invoke("get-offline-simulation-status"),
    // オフラインシミュレーションを明示的に設定
    setOfflineSimulation: (offline: boolean) =>
      ipcRenderer.invoke("set-offline-simulation", offline),
  },

  // キャッシュ機能（オフラインライブラリ表示用）
  cache: {
    // 曲のメタデータをキャッシュ
    syncSongsMetadata: (songs: any[]) =>
      ipcRenderer.invoke("sync-songs-metadata", songs),
    // プレイリストをキャッシュ
    syncPlaylists: (playlists: any[]) =>
      ipcRenderer.invoke("sync-playlists", playlists),
    // プレイリスト内の曲をキャッシュ
    syncPlaylistSongs: (data: any) =>
      ipcRenderer.invoke("sync-playlist-songs", data),
    // いいねをキャッシュ
    syncLikedSongs: (data: any) => ipcRenderer.invoke("sync-liked-songs", data),
    // スポットライトをキャッシュ
    syncSpotlightsMetadata: (data: any[]) =>
      ipcRenderer.invoke("sync-spotlights-metadata", data),
    // セクションをキャッシュ
    syncSection: (data: { key: string; data: any[] }) =>
      ipcRenderer.invoke("sync-section", data),
    // キャッシュからセクションデータを取得
    getSectionData: (key: string, type: string) =>
      ipcRenderer.invoke("get-section-data", { key, type }),
    // キャッシュからプレイリストを取得
    getCachedPlaylists: (userId: string) =>
      ipcRenderer.invoke("get-cached-playlists", userId),
    // キャッシュからいいね曲を取得
    getCachedLikedSongs: (userId: string) =>
      ipcRenderer.invoke("get-cached-liked-songs", userId),
    // キャッシュからプレイリスト内の曲を取得
    getCachedPlaylistSongs: (playlistId: string) =>
      ipcRenderer.invoke("get-cached-playlist-songs", playlistId),
    // DBの中身をダンプ (デバッグ用)
    debugDumpDb: () => ipcRenderer.invoke("debug-dump-db"),
    // Local-first mutation methods
    addLikedSong: (data: { userId: string; songId: string }) =>
      ipcRenderer.invoke("add-liked-song", data),
    removeLikedSong: (data: { userId: string; songId: string }) =>
      ipcRenderer.invoke("remove-liked-song", data),
    getLikeStatus: (data: { userId: string; songId: string }) =>
      ipcRenderer.invoke("get-like-status", data),
    addPlaylistSong: (data: { playlistId: string; songId: string }) =>
      ipcRenderer.invoke("add-playlist-song", data),
    removePlaylistSong: (data: { playlistId: string; songId: string }) =>
      ipcRenderer.invoke("remove-playlist-song", data),
  },

  // 認証キャッシュ（オフラインログイン用）
  auth: {
    // ユーザー情報を保存
    saveCachedUser: (user: {
      id: string;
      email?: string;
      avatarUrl?: string;
    }) => ipcRenderer.invoke("save-cached-user", user),
    // ユーザー情報を取得
    getCachedUser: () => ipcRenderer.invoke("get-cached-user"),
    // ユーザー情報をクリア
    clearCachedUser: () => ipcRenderer.invoke("clear-cached-user"),
  },

  // IPC通信
  ipc: {
    // メインプロセスにメッセージを送信し、応答を待つ
    invoke: (channel: string, ...args: any[]) => {
      if (validateChannel(channel, ALLOWED_INVOKE_CHANNELS)) {
        return ipcRenderer.invoke(channel, ...args);
      }
    },

    // メインプロセスからのメッセージを受信
    on: (channel: string, callback: (...args: any[]) => void) => {
      if (validateChannel(channel, ALLOWED_ON_CHANNELS)) {
        const subscription = (_: any, ...args: any[]) => callback(...args);
        ipcRenderer.on(channel, subscription);

        // リスナーの登録解除関数を返す
        return () => {
          ipcRenderer.removeListener(channel, subscription);
        };
      }
    },

    // メインプロセスにメッセージを送信（応答を待たない）
    send: (channel: string, ...args: any[]) => {
      if (validateChannel(channel, ALLOWED_SEND_CHANNELS)) {
        ipcRenderer.send(channel, ...args);
      }
    },
  },
});

// コンソールにプリロードスクリプトが実行されたことを表示
console.log("Preload script has been loaded");
