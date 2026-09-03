import { contextBridge, ipcRenderer } from "electron";

/**
 * ★ チャンネル定義のインライン化について
 *
 * preload スクリプトは sandbox 環境で実行されるため、相対モジュールの
 * require が使えず、../channels を import できない（実行時に失敗する）。
 * そのため許可リストをこのファイルにインライン保持する。
 *
 * 正 (=single source of truth): electron/channels.ts
 *   - main プロセスの ipcMain.handle
 *   - renderer の invoke / on / send
 * このインライン定義との一致は
 * __tests__/electron/preload/channels-consistency.test.ts が保証する。
 * 値を変更する場合は必ず channels.ts と同時に変更すること。
 */

export const CHANNELS = {
  // Window
  WINDOW_MINIMIZE: "window-minimize",
  WINDOW_MAXIMIZE: "window-maximize",
  WINDOW_CLOSE: "window-close",

  // Store
  GET_STORE_VALUE: "get-store-value",
  SET_STORE_VALUE: "set-store-value",

  // File
  SELECT_DIRECTORY: "handle-select-directory",
  SCAN_MP3_FILES: "handle-scan-mp3-files",
  GET_MP3_METADATA: "handle-get-mp3-metadata",
  GET_SAVED_MUSIC_LIBRARY: "handle-get-saved-music-library",
  CHECK_FILE_EXISTS: "check-file-exists",
  CHECK_LOCAL_FILE_EXISTS: "check-local-file-exists",
  GET_LOCAL_FILE_PATH: "get-local-file-path",
  GET_CACHED_FILES_WITH_METADATA: "handle-get-cached-files-with-metadata",

  // Offline
  DOWNLOAD_SONG: "download-song",
  DELETE_SONG: "delete-song",
  GET_OFFLINE_SONGS: "get-offline-songs",
  DELETE_OFFLINE_SONG: "delete-offline-song",
  CHECK_OFFLINE_STATUS: "check-offline-status",
  TOGGLE_OFFLINE_SIMULATION: "toggle-offline-simulation",
  GET_OFFLINE_SIMULATION_STATUS: "get-offline-simulation-status",
  SET_OFFLINE_SIMULATION: "set-offline-simulation",

  // Cache
  SYNC_SONGS_METADATA: "sync-songs-metadata",
  SYNC_PLAYLISTS: "sync-playlists",
  SYNC_PLAYLIST_SONGS: "sync-playlist-songs",
  SYNC_LIKED_SONGS: "sync-liked-songs",
  SYNC_SPOTLIGHTS_METADATA: "sync-spotlights-metadata",
  SYNC_SECTION: "sync-section",
  GET_SECTION_DATA: "get-section-data",
  GET_CACHED_PLAYLISTS: "get-cached-playlists",
  GET_CACHED_LIKED_SONGS: "get-cached-liked-songs",
  GET_CACHED_PLAYLIST_SONGS: "get-cached-playlist-songs",
  GET_SONG_BY_ID: "get-song-by-id",
  GET_PLAYLIST_BY_ID: "get-playlist-by-id",
  GET_SONGS_PAGINATED: "get-songs-paginated",
  GET_SONGS_TOTAL_COUNT: "get-songs-total-count",
  DEBUG_DUMP_DB: "debug-dump-db",

  // Mutation (local-first)
  ADD_LIKED_SONG: "add-liked-song",
  REMOVE_LIKED_SONG: "remove-liked-song",
  GET_LIKE_STATUS: "get-like-status",
  ADD_PLAYLIST_SONG: "add-playlist-song",
  REMOVE_PLAYLIST_SONG: "remove-playlist-song",

  // Auth
  SAVE_CACHED_USER: "save-cached-user",
  GET_CACHED_USER: "get-cached-user",
  CLEAR_CACHED_USER: "clear-cached-user",
  START_GOOGLE_OAUTH: "auth:start-google-oauth",
  OPEN_OAUTH_WINDOW: "auth:open-oauth-window",

  // External services
  DISCORD_SET_ACTIVITY: "discord:set-activity",
  DISCORD_CLEAR_ACTIVITY: "discord:clear-activity",

  // Transcribe
  GENERATE_LRC: "transcribe:generate-lrc",

  // MiniPlayer
  MINI_PLAYER_OPEN: "mini-player:open",
  MINI_PLAYER_CLOSE: "mini-player:close",
  MINI_PLAYER_UPDATE_STATE: "mini-player:update-state",
  MINI_PLAYER_CONTROL: "mini-player:control",
  MINI_PLAYER_IS_OPEN: "mini-player:is-open",
  MINI_PLAYER_READY: "mini-player:ready",

  // 受信 (on) チャンネル
  MEDIA_CONTROL: "media-control",
  DOWNLOAD_PROGRESS: "download-progress",
  OFFLINE_SIMULATION_CHANGED: "offline-simulation-changed",
  SCAN_PROGRESS: "scan-progress",
  MINI_PLAYER_STATE_CHANGED: "mini-player:state-changed",
  MINI_PLAYER_REQUEST_STATE: "mini-player:request-state",
  AUTH_CALLBACK: "auth-callback",
  AUTH_WINDOW_CLOSED: "auth-window-closed",

  // 送信 (send) チャンネル
  LOG: "log",
  PLAYER_STATE_CHANGE: "player-state-change",
} as const;

/** invoke 許可チャンネル（preload のセキュリティ検証用） */
export const INVOKE_CHANNELS = [
  CHANNELS.WINDOW_MINIMIZE,
  CHANNELS.WINDOW_MAXIMIZE,
  CHANNELS.WINDOW_CLOSE,
  CHANNELS.GET_STORE_VALUE,
  CHANNELS.SET_STORE_VALUE,
  CHANNELS.SELECT_DIRECTORY,
  CHANNELS.SCAN_MP3_FILES,
  CHANNELS.GET_MP3_METADATA,
  CHANNELS.GET_SAVED_MUSIC_LIBRARY,
  CHANNELS.CHECK_FILE_EXISTS,
  CHANNELS.CHECK_LOCAL_FILE_EXISTS,
  CHANNELS.GET_LOCAL_FILE_PATH,
  CHANNELS.GET_CACHED_FILES_WITH_METADATA,
  CHANNELS.DOWNLOAD_SONG,
  CHANNELS.DELETE_SONG,
  CHANNELS.GET_OFFLINE_SONGS,
  CHANNELS.DELETE_OFFLINE_SONG,
  CHANNELS.CHECK_OFFLINE_STATUS,
  CHANNELS.TOGGLE_OFFLINE_SIMULATION,
  CHANNELS.GET_OFFLINE_SIMULATION_STATUS,
  CHANNELS.SET_OFFLINE_SIMULATION,
  CHANNELS.SYNC_SONGS_METADATA,
  CHANNELS.SYNC_PLAYLISTS,
  CHANNELS.SYNC_PLAYLIST_SONGS,
  CHANNELS.SYNC_LIKED_SONGS,
  CHANNELS.SYNC_SPOTLIGHTS_METADATA,
  CHANNELS.SYNC_SECTION,
  CHANNELS.GET_SECTION_DATA,
  CHANNELS.GET_CACHED_PLAYLISTS,
  CHANNELS.GET_CACHED_LIKED_SONGS,
  CHANNELS.GET_CACHED_PLAYLIST_SONGS,
  CHANNELS.GET_SONG_BY_ID,
  CHANNELS.GET_PLAYLIST_BY_ID,
  CHANNELS.GET_SONGS_PAGINATED,
  CHANNELS.GET_SONGS_TOTAL_COUNT,
  CHANNELS.DEBUG_DUMP_DB,
  CHANNELS.ADD_LIKED_SONG,
  CHANNELS.REMOVE_LIKED_SONG,
  CHANNELS.GET_LIKE_STATUS,
  CHANNELS.ADD_PLAYLIST_SONG,
  CHANNELS.REMOVE_PLAYLIST_SONG,
  CHANNELS.SAVE_CACHED_USER,
  CHANNELS.GET_CACHED_USER,
  CHANNELS.CLEAR_CACHED_USER,
  CHANNELS.START_GOOGLE_OAUTH,
  CHANNELS.OPEN_OAUTH_WINDOW,
  CHANNELS.DISCORD_SET_ACTIVITY,
  CHANNELS.DISCORD_CLEAR_ACTIVITY,
  CHANNELS.GENERATE_LRC,
  CHANNELS.MINI_PLAYER_OPEN,
  CHANNELS.MINI_PLAYER_CLOSE,
  CHANNELS.MINI_PLAYER_UPDATE_STATE,
  CHANNELS.MINI_PLAYER_CONTROL,
  CHANNELS.MINI_PLAYER_IS_OPEN,
  CHANNELS.MINI_PLAYER_READY,
] as const;

/** on (受信) 許可チャンネル */
export const ON_CHANNELS = [
  CHANNELS.MEDIA_CONTROL,
  CHANNELS.DOWNLOAD_PROGRESS,
  CHANNELS.OFFLINE_SIMULATION_CHANGED,
  CHANNELS.SCAN_PROGRESS,
  CHANNELS.MINI_PLAYER_STATE_CHANGED,
  CHANNELS.MINI_PLAYER_REQUEST_STATE,
  CHANNELS.AUTH_CALLBACK,
  CHANNELS.AUTH_WINDOW_CLOSED,
] as const;

/** send (送信) 許可チャンネル */
export const SEND_CHANNELS = [CHANNELS.LOG, CHANNELS.PLAYER_STATE_CHANGE] as const;

// チャンネル検証用の共通関数
function validateChannel(
  channel: string,
  allowedChannels: readonly string[],
): boolean {
  if (!allowedChannels.includes(channel)) {
    throw new Error(
      `Channel "${channel}" is not allowed for security reasons.`,
    );
  }
  return true;
}

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
    minimize: () => ipcRenderer.invoke(CHANNELS.WINDOW_MINIMIZE),
    maximize: () => ipcRenderer.invoke(CHANNELS.WINDOW_MAXIMIZE),
    close: () => ipcRenderer.invoke(CHANNELS.WINDOW_CLOSE),
  },

  // 設定ストア操作
  store: {
    get: (key: string) => ipcRenderer.invoke(CHANNELS.GET_STORE_VALUE, key),
    set: (key: string, value: string | number | boolean | null) =>
      ipcRenderer.invoke(CHANNELS.SET_STORE_VALUE, key, value),
  },

  // メディア制御
  media: {
    // メディア制御イベントのリスナーを登録
    onMediaControl: (callback: (action: string) => void) => {
      const subscription = (_: Electron.IpcRendererEvent, action: string) => callback(action);
      ipcRenderer.on(CHANNELS.MEDIA_CONTROL, subscription);

      // リスナーの登録解除関数を返す
      return () => {
        ipcRenderer.removeListener(CHANNELS.MEDIA_CONTROL, subscription);
      };
    },
  },

  // オフライン機能
  offline: {
    // オフライン（ダウンロード済み）の曲を全て取得
    getSongs: () => ipcRenderer.invoke(CHANNELS.GET_OFFLINE_SONGS),
    // 曲がダウンロード済みかチェック
    checkStatus: (songId: string) =>
      ipcRenderer.invoke(CHANNELS.CHECK_OFFLINE_STATUS, songId),
    // オフライン曲を削除（ファイル + DB）
    deleteSong: (songId: string) =>
      ipcRenderer.invoke(CHANNELS.DELETE_OFFLINE_SONG, songId),
    // 曲をダウンロード（メタデータ付き）
    downloadSong: (song: { id: string; title: string; author: string; song_path: string; image_path: string }) =>
      ipcRenderer.invoke(CHANNELS.DOWNLOAD_SONG, song),
  },

  // 開発用ユーティリティ
  dev: {
    // オフラインシミュレーションを切り替え
    toggleOfflineSimulation: () =>
      ipcRenderer.invoke(CHANNELS.TOGGLE_OFFLINE_SIMULATION),
    // 現在のオフラインシミュレーション状態を取得
    getOfflineSimulationStatus: () =>
      ipcRenderer.invoke(CHANNELS.GET_OFFLINE_SIMULATION_STATUS),
    // オフラインシミュレーションを明示的に設定
    setOfflineSimulation: (offline: boolean) =>
      ipcRenderer.invoke(CHANNELS.SET_OFFLINE_SIMULATION, offline),
  },

  // キャッシュ機能（オフラインライブラリ表示用）
  cache: {
    // 曲のメタデータをキャッシュ
    syncSongsMetadata: (songs: { id: string; title: string; author: string; song_path: string; image_path: string; genre?: string; count?: number; like_count?: number; created_at: string; user_id?: string; video_path?: string; duration?: number; lyrics?: string }[]) =>
      ipcRenderer.invoke(CHANNELS.SYNC_SONGS_METADATA, songs),
    // プレイリストをキャッシュ
    syncPlaylists: (playlists: { id: string; title: string; image_path?: string; is_public: boolean; created_at: string; user_name?: string; user_id?: string; createdAt?: string }[]) =>
      ipcRenderer.invoke(CHANNELS.SYNC_PLAYLISTS, playlists),
    // プレイリスト内の曲をキャッシュ
    syncPlaylistSongs: (data: { playlistId: string; songs: { id: string; title: string; author: string; song_path: string; image_path: string }[] }) =>
      ipcRenderer.invoke(CHANNELS.SYNC_PLAYLIST_SONGS, data),
    // いいねをキャッシュ
    syncLikedSongs: (data: { userId: string; songs: { id: string; title: string; author: string; song_path: string; image_path: string }[] }) =>
      ipcRenderer.invoke(CHANNELS.SYNC_LIKED_SONGS, data),
    // スポットライトをキャッシュ
    syncSpotlightsMetadata: (data: { id: string; video_path: string; title: string; author: string; genre?: string; description?: string; thumbnail_path?: string; created_at?: string }[]) =>
      ipcRenderer.invoke(CHANNELS.SYNC_SPOTLIGHTS_METADATA, data),
    // セクションをキャッシュ
    syncSection: (data: { key: string; data: Record<string, unknown>[] }) =>
      ipcRenderer.invoke(CHANNELS.SYNC_SECTION, data),
    // キャッシュからセクションデータを取得
    getSectionData: (key: string, type: string) =>
      ipcRenderer.invoke(CHANNELS.GET_SECTION_DATA, { key, type }),
    // キャッシュからプレイリストを取得
    getCachedPlaylists: (userId: string) =>
      ipcRenderer.invoke(CHANNELS.GET_CACHED_PLAYLISTS, userId),
    // キャッシュからいいね曲を取得
    getCachedLikedSongs: (userId: string) =>
      ipcRenderer.invoke(CHANNELS.GET_CACHED_LIKED_SONGS, userId),
    // キャッシュからプレイリスト内の曲を取得
    getCachedPlaylistSongs: (playlistId: string) =>
      ipcRenderer.invoke(CHANNELS.GET_CACHED_PLAYLIST_SONGS, playlistId),
    // DBの中身をダンプ (デバッグ用)
    debugDumpDb: () => ipcRenderer.invoke(CHANNELS.DEBUG_DUMP_DB),
    // Local-first mutation methods
    addLikedSong: (data: { userId: string; songId: string }) =>
      ipcRenderer.invoke(CHANNELS.ADD_LIKED_SONG, data),
    removeLikedSong: (data: { userId: string; songId: string }) =>
      ipcRenderer.invoke(CHANNELS.REMOVE_LIKED_SONG, data),
    getLikeStatus: (data: { userId: string; songId: string }) =>
      ipcRenderer.invoke(CHANNELS.GET_LIKE_STATUS, data),
    addPlaylistSong: (data: { playlistId: string; songId: string }) =>
      ipcRenderer.invoke(CHANNELS.ADD_PLAYLIST_SONG, data),
    removePlaylistSong: (data: { playlistId: string; songId: string }) =>
      ipcRenderer.invoke(CHANNELS.REMOVE_PLAYLIST_SONG, data),
    // 単一の曲情報を取得（ローカルDB）
    getSongById: (songId: string) =>
      ipcRenderer.invoke(CHANNELS.GET_SONG_BY_ID, songId),
    // 単一のプレイリスト情報を取得（ローカルDB）
    getPlaylistById: (playlistId: string) =>
      ipcRenderer.invoke(CHANNELS.GET_PLAYLIST_BY_ID, playlistId),
    // ページネーション対応の曲取得
    getSongsPaginated: (offset: number, limit: number) =>
      ipcRenderer.invoke(CHANNELS.GET_SONGS_PAGINATED, { offset, limit }),
    // 曲の総件数を取得
    getSongsTotalCount: () => ipcRenderer.invoke(CHANNELS.GET_SONGS_TOTAL_COUNT),
  },

  // 認証キャッシュ
  auth: {
    // 外部ブラウザでGoogle認証を開始
    startGoogleOAuth: (authUrl: string) =>
      ipcRenderer.invoke(CHANNELS.START_GOOGLE_OAUTH, authUrl),
    // 認証用BrowserWindowを開く
    openOAuthWindow: (authUrl: string) =>
      ipcRenderer.invoke(CHANNELS.OPEN_OAUTH_WINDOW, authUrl),
    // ユーザー情報を保存
    saveCachedUser: (user: {
      id: string;
      email?: string;
      avatarUrl?: string;
    }) => ipcRenderer.invoke(CHANNELS.SAVE_CACHED_USER, user),
    // ユーザー情報を取得
    getCachedUser: () => ipcRenderer.invoke(CHANNELS.GET_CACHED_USER),
    // ユーザー情報をクリア
    clearCachedUser: () => ipcRenderer.invoke(CHANNELS.CLEAR_CACHED_USER),
  },

  discord: {
    setActivity: (activity: { details?: string; state?: string; startTimestamp?: number; endTimestamp?: number; largeImageKey?: string; largeImageText?: string; smallImageKey?: string; smallImageText?: string }) =>
      ipcRenderer.invoke(CHANNELS.DISCORD_SET_ACTIVITY, activity),
    clearActivity: () => ipcRenderer.invoke(CHANNELS.DISCORD_CLEAR_ACTIVITY),
  },

  // トランスクライブ機能
  transcribe: {
    generateLrc: (audioPath: string, lyricsText: string) =>
      ipcRenderer.invoke(CHANNELS.GENERATE_LRC, audioPath, lyricsText),
  },

  // ミニプレイヤー機能
  miniPlayer: {
    // ミニプレイヤーを開く
    open: () => ipcRenderer.invoke(CHANNELS.MINI_PLAYER_OPEN),
    // ミニプレイヤーを閉じる
    close: () => ipcRenderer.invoke(CHANNELS.MINI_PLAYER_CLOSE),
    // 再生状態を更新
    updateState: (state: {
      song: {
        id: string;
        title: string;
        author: string;
        image_path: string | null;
      } | null;
      isPlaying: boolean;
    }) => ipcRenderer.invoke(CHANNELS.MINI_PLAYER_UPDATE_STATE, state),
    // ミニプレイヤーから再生コントロール
    control: (action: "play-pause" | "next" | "previous") =>
      ipcRenderer.invoke(CHANNELS.MINI_PLAYER_CONTROL, action),
    // ミニプレイヤーが開いているか確認
    isOpen: () => ipcRenderer.invoke(CHANNELS.MINI_PLAYER_IS_OPEN),
    // ミニプレイヤーの準備完了を通知
    ready: () => ipcRenderer.invoke(CHANNELS.MINI_PLAYER_READY),
    // 状態変更イベントのリスナーを登録（ミニプレイヤー側で使用）
    onStateChange: (
      callback: (state: {
        song: {
          id: string;
          title: string;
          author: string;
          image_path: string | null;
        } | null;
        isPlaying: boolean;
      }) => void,
    ) => {
      const subscription = (_: Electron.IpcRendererEvent, state: {
        song: {
          id: string;
          title: string;
          author: string;
          image_path: string | null;
        } | null;
        isPlaying: boolean;
      }) => callback(state);
      ipcRenderer.on(CHANNELS.MINI_PLAYER_STATE_CHANGED, subscription);
      return () => {
        ipcRenderer.removeListener(CHANNELS.MINI_PLAYER_STATE_CHANGED, subscription);
      };
    },
    // 状態再送信リクエストのリスナーを登録（メインウィンドウ側で使用）
    onRequestState: (callback: () => void) => {
      const subscription = () => callback();
      ipcRenderer.on(CHANNELS.MINI_PLAYER_REQUEST_STATE, subscription);
      return () => {
        ipcRenderer.removeListener(CHANNELS.MINI_PLAYER_REQUEST_STATE, subscription);
      };
    },
  },

  // IPC通信
  ipc: {
    // メインプロセスにメッセージを送信し、応答を待つ
    invoke: (channel: string, ...args: unknown[]) => {
      if (validateChannel(channel, INVOKE_CHANNELS)) {
        return ipcRenderer.invoke(channel, ...args);
      }
    },

    // メインプロセスからのメッセージを受信
    on: (channel: string, callback: (...args: unknown[]) => void) => {
      if (validateChannel(channel, ON_CHANNELS)) {
        const subscription = (_: Electron.IpcRendererEvent, ...args: unknown[]) => callback(...args);
        ipcRenderer.on(channel, subscription);

        // リスナーの登録解除関数を返す
        return () => {
          ipcRenderer.removeListener(channel, subscription);
        };
      }
    },

    // メインプロセスにメッセージを送信（応答を待たない）
    send: (channel: string, ...args: unknown[]) => {
      if (validateChannel(channel, SEND_CHANNELS)) {
        ipcRenderer.send(channel, ...args);
      }
    },
  },
});
