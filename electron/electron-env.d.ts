/// <reference types="electron" />

// Electronのウィンドウオブジェクトに公開されるAPIの型定義
interface ElectronAPI {
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

  // 認証操作
  auth: {
    // メールアドレスとパスワードでログイン
    signIn: (email: string, password: string) => Promise<any>;
    // メールアドレスとパスワードでサインアップ
    signUp: (email: string, password: string, fullName: string) => Promise<any>;
    // ログアウト
    signOut: () => Promise<any>;
    // 現在のセッションを取得
    getSession: () => Promise<any>;
    // OAuthプロバイダーでログイン
    signInWithOAuth: (provider: string) => Promise<any>;
    // セッション更新イベントのリスナーを登録
    onSessionUpdated: (callback: (data: any) => void) => () => void;
  };

  // メディア制御
  media: {
    // メディア制御イベントのリスナーを登録
    onMediaControl: (callback: (action: string) => void) => () => void;
  };

  // アップデート機能
  updater: {
    // 手動でアップデートをチェック
    checkForUpdates: () => Promise<boolean>;
    // アップデートが利用可能になったときのリスナーを登録
    onUpdateAvailable: (callback: () => void) => () => void;
    // ダウンロード進捗のリスナーを登録
    onDownloadProgress: (callback: (progressObj: any) => void) => () => void;
    // アップデートのダウンロードが完了したときのリスナーを登録
    onUpdateDownloaded: (callback: (info: any) => void) => () => void;
  };

  // IPC通信
  ipc: {
    // メインプロセスにメッセージを送信し、応答を待つ
    invoke: <T = any>(channel: string, ...args: any[]) => Promise<T>;
    // メインプロセスからのメッセージを受信
    on: <T = any>(
      channel: string,
      callback: (...args: T[]) => void
    ) => () => void;
    // メインプロセスにメッセージを送信（応答を待たない）
    send: (channel: string, ...args: any[]) => void;
  };
}

// グローバルなWindowオブジェクトにElectron APIを追加
declare global {
  interface Window {
    electron: ElectronAPI;
  }
}
