/// <reference types="electron" />

import type { SongForSync, PlaylistForSync, SpotlightForSync, Playlist } from "../types";
import type { OfflineSong, SongDownloadPayload, SectionItem } from "../types/local";

// Electronのウィンドウオブジェクトに公開されるAPIの型定義
export interface ElectronAPI {
  // アプリケーション情報
  appInfo: {
    // アプリケーションのバージョンを取得
    getVersion: () => string;
    // 実行環境がElectronかどうかを判定
    isElectron: boolean;
    // プラットフォーム情報
    platform: NodeJS.Platform;
  };

  // ウィンドウ操作
  window: {
    // ウィンドウを最小化
    minimize: () => Promise<void>;
    // ウィンドウを最大化/元のサイズに戻す
    maximize: () => Promise<void>;
    // ウィンドウを閉じる
    close: () => Promise<void>;
  };

  // 設定ストア操作
  store: {
    // 設定値を取得
    get: <T>(key: string) => Promise<T>;
    // 設定値を保存
    set: <T>(key: string, value: T) => Promise<boolean>;
  };

  // メディア制御
  media: {
    // メディア制御イベントのリスナーを登録
    onMediaControl: (callback: (action: string) => void) => () => void;
  };

  // オフライン機能 (Phase 2)
  offline: {
    // オフライン（ダウンロード済み）の曲を全て取得
    getSongs: () => Promise<OfflineSong[]>;
    checkStatus: (
      songId: string,
    ) => Promise<{ isDownloaded: boolean; localPath?: string }>;
    // オフライン曲を削除（ファイル + DB）
    deleteSong: (
      songId: string,
    ) => Promise<{ success: boolean; error?: string }>;
    // 曲をダウンロード（メタデータ付き）
    downloadSong: (
      song: SongDownloadPayload,
    ) => Promise<{ success: boolean; localPath?: string; error?: string }>;
  };

  // 開発用ユーティリティ
  dev: {
    // オフラインシミュレーションを切り替え
    toggleOfflineSimulation: () => Promise<{ isOffline: boolean }>;
    // 現在のオフラインシミュレーション状態を取得
    getOfflineSimulationStatus: () => Promise<{ isOffline: boolean }>;
    // オフラインシミュレーションを明示的に設定
    setOfflineSimulation: (offline: boolean) => Promise<{ isOffline: boolean }>;
  };

  // キャッシュ機能（オフラインライブラリ表示用）
  cache: {
    // 曲のメタデータをキャッシュ
    syncSongsMetadata: (
      songs: SongForSync[],
    ) => Promise<{ success: boolean; count: number; error?: string }>;
    // プレイリストをキャッシュ
    syncPlaylists: (
      playlists: PlaylistForSync[],
    ) => Promise<{ success: boolean; count: number; error?: string }>;
    // プレイリスト内の曲をキャッシュ
    syncPlaylistSongs: (data: {
      playlistId: string;
      songs: SongForSync[];
    }) => Promise<{ success: boolean; count: number; error?: string }>;
    // いいねをキャッシュ
    syncLikedSongs: (data: {
      userId: string;
      songs: SongForSync[];
    }) => Promise<{ success: boolean; count: number; error?: string }>;
    // キャッシュからプレイリストを取得
    getCachedPlaylists: (userId: string) => Promise<PlaylistForSync[]>;
    // キャッシュからいいね曲を取得
    getCachedLikedSongs: (userId: string) => Promise<SongForSync[]>;
    // キャッシュからプレイリスト内の曲を取得
    getCachedPlaylistSongs: (playlistId: string) => Promise<SongForSync[]>;
    // Local-first mutation methods
    addLikedSong: (data: {
      userId: string;
      songId: string;
    }) => Promise<{ success: boolean; error?: string }>;
    removeLikedSong: (data: {
      userId: string;
      songId: string;
    }) => Promise<{ success: boolean; error?: string }>;
    getLikeStatus: (data: {
      userId: string;
      songId: string;
    }) => Promise<{ isLiked: boolean; error?: string }>;
    addPlaylistSong: (data: {
      playlistId: string;
      songId: string;
    }) => Promise<{ success: boolean; error?: string }>;
    removePlaylistSong: (data: {
      playlistId: string;
      songId: string;
    }) => Promise<{ success: boolean; error?: string }>;
    // Spotlight and Section caching
    syncSpotlightsMetadata: (
      spotlights: SpotlightForSync[],
    ) => Promise<{ success: boolean; count: number; error?: string }>;
    syncSection: (data: {
      key: string;
      data: SectionItem[];
    }) => Promise<{ success: boolean; count: number; error?: string }>;
    getSectionData: (key: string, table: string) => Promise<SectionItem[]>;
    // Specialized queries
    getSongById: (id: string) => Promise<SongForSync | null>;
    getPlaylistById: (id: string) => Promise<PlaylistForSync | null>;
    getSongsPaginated: (limit: number, offset: number) => Promise<SongForSync[]>;
    getSongsTotalCount: () => Promise<number>;
  };

  // 認証キャッシュ
  auth: {
    // ユーザー情報を保存
    saveCachedUser: (user: {
      id: string;
      email?: string;
      avatarUrl?: string;
    }) => Promise<{ success: boolean }>;
    // ユーザー情報を取得
    getCachedUser: () => Promise<{
      id: string;
      email?: string;
      avatarUrl?: string;
    } | null>;
    // ユーザー情報をクリア
    clearCachedUser: () => Promise<{ success: boolean }>;
    // Google OAuth開始
    startGoogleOAuth: (authUrl: string) => Promise<{ success: boolean; error?: string }>;
    // OAuthウィンドウを開く
    openOAuthWindow: (authUrl: string) => Promise<{ success: boolean; error?: string }>;
  };

  // Discord RPC
  discord: {
    setActivity: (activity: { details?: string; state?: string; largeImageKey?: string; largeImageText?: string; smallImageKey?: string; smallImageText?: string; startTimestamp?: number; endTimestamp?: number; instance?: boolean; }) => Promise<void>;
    clearActivity: () => Promise<void>;
  };

  // ミニプレイヤー
  miniPlayer: {
    // ミニプレイヤーを開く
    open: () => Promise<{ success: boolean; error?: string }>;
    // ミニプレイヤーを閉じる
    close: () => Promise<{ success: boolean; error?: string }>;
    // 再生状態を更新
    updateState: (state: {
      song: {
        id: string;
        title: string;
        author: string;
        image_path: string | null;
      } | null;
      isPlaying: boolean;
    }) => Promise<{ success: boolean; error?: string }>;
    // ミニプレイヤーから再生コントロール
    control: (
      action: "play-pause" | "next" | "previous",
    ) => Promise<{ success: boolean; error?: string }>;
    // ミニプレイヤーが開いているか確認
    isOpen: () => Promise<boolean>;
    // ミニプレイヤーの準備完了を通知
    ready: () => Promise<{ success: boolean; error?: string }>;
    // 状態変更イベントのリスナーを登録
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
    ) => () => void;
    // 状態再送信リクエストのリスナーを登録
    onRequestState: (callback: () => void) => () => void;
  };

  // IPC通信
  ipc: {
    // メインプロセスにメッセージを送信し、応答を待つ
    invoke: <T = unknown>(channel: string, ...args: unknown[]) => Promise<T>;
    // メインプロセスからのメッセージを受信
    on: <T = unknown>(
      channel: string,
      callback: (...args: T[]) => void,
    ) => () => void;
    // メインプロセスにメッセージを送信（応答を待たない）
    send: (channel: string, ...args: unknown[]) => void;
  };

  // 文字起こし
  transcribe: {
    // LRCファイルを生成
    generateLrc: (audioPath: string, lyricsText: string) => Promise<{ status: string; lrc?: string; message?: string }>;
  };
}

// グローバルなWindowオブジェクトにElectron APIを追加
declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

// このファイルをモジュールとして扱うためのエクスポート
export {};
