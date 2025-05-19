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
  "check-for-updates",
  "auth:signIn",
  "auth:signUp",
  "auth:signOut",
  "auth:getSession",
  "auth:signInWithOAuth",
];

const ALLOWED_ON_CHANNELS = [
  "media-control",
  "update-available",
  "download-progress",
  "update-downloaded",
  "auth:sessionUpdated",
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

  // 認証操作
  auth: {
    signIn: (email: string, password: string) =>
      ipcRenderer.invoke("auth:signIn", { email, password }),
    signUp: (email: string, password: string, fullName: string) =>
      ipcRenderer.invoke("auth:signUp", { email, password, fullName }),
    signOut: () => ipcRenderer.invoke("auth:signOut"),
    getSession: () => ipcRenderer.invoke("auth:getSession"),
    signInWithOAuth: (provider: string) =>
      ipcRenderer.invoke("auth:signInWithOAuth", { provider }),
    onSessionUpdated: (callback: (data: any) => void) => {
      const subscription = (_: any, data: any) => callback(data);
      ipcRenderer.on("auth:sessionUpdated", subscription);

      return () => {
        ipcRenderer.removeListener("auth:sessionUpdated", subscription);
      };
    },
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

  // アップデート機能
  updater: {
    // 手動でアップデートをチェック
    checkForUpdates: () => ipcRenderer.invoke("check-for-updates"),

    // アップデートが利用可能になったときのリスナーを登録
    onUpdateAvailable: (callback: () => void) => {
      const subscription = () => callback();
      ipcRenderer.on("update-available", subscription);

      // リスナーの登録解除関数を返す
      return () => {
        ipcRenderer.removeListener("update-available", subscription);
      };
    },

    // ダウンロード進捗のリスナーを登録
    onDownloadProgress: (callback: (progressObj: any) => void) => {
      const subscription = (_: any, progressObj: any) => callback(progressObj);
      ipcRenderer.on("download-progress", subscription);

      // リスナーの登録解除関数を返す
      return () => {
        ipcRenderer.removeListener("download-progress", subscription);
      };
    },

    // アップデートのダウンロードが完了したときのリスナーを登録
    onUpdateDownloaded: (callback: (info: any) => void) => {
      const subscription = (_: any, info: any) => callback(info);
      ipcRenderer.on("update-downloaded", subscription);

      return () => {
        ipcRenderer.removeListener("update-downloaded", subscription);
      };
    },
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
