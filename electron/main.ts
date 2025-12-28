import { app, BrowserWindow, globalShortcut, session } from "electron";
import * as path from "path";
import { loadEnvVariables, debugLog } from "./utils";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { getDb } from "./db/client";

// モジュールのインポート
import { registerProtocolHandlers } from "./lib/protocol";
import { createMainWindow, getMainWindow } from "./lib/window-manager";
import { setupTray, destroyTray } from "./lib/tray";

// IPCハンドラーのインポート
import { setupDownloadHandlers } from "./ipc/offline";
import {
  setupSettingsHandlers,
  getIsSimulatingOffline,
  setIsSimulatingOffline,
} from "./ipc/settings";
import { setupWindowHandlers } from "./ipc/window";
import { setupDialogHandlers } from "./ipc/dialog";
import { setupLibraryHandlers } from "./ipc/library";
import { setupSimpleDownloadHandlers } from "./ipc/simple_download";
import { setupCacheHandlers } from "./ipc/cache";
import { setupAuthHandlers } from "./ipc/auth";

// 環境変数を読み込む
loadEnvVariables();

// プラットフォーム判定
const isMac = process.platform === "darwin";

// IPC通信のセットアップ
function setupIPC() {
  // 設定ハンドラーのセットアップ
  setupSettingsHandlers();

  // ウィンドウ制御ハンドラーのセットアップ
  setupWindowHandlers();

  // ダイアログハンドラーのセットアップ
  setupDialogHandlers();

  // ライブラリハンドラーのセットアップ
  setupLibraryHandlers();

  // 簡易ダウンロードハンドラーのセットアップ
  setupSimpleDownloadHandlers();

  // オフラインダウンロードハンドラーのセットアップ
  setupDownloadHandlers();

  // キャッシュハンドラーのセットアップ（オフラインライブラリ表示用）
  setupCacheHandlers();

  // 認証キャッシュハンドラーのセットアップ
  setupAuthHandlers();
}

// 開発用ショートカットキーのセットアップ
function setupDevShortcuts() {
  // Ctrl+Shift+O: オフラインモードのトグル
  globalShortcut.register("CommandOrControl+Shift+O", () => {
    // settings.ts の状態を更新
    const newState = !getIsSimulatingOffline();
    setIsSimulatingOffline(newState);

    const mainWindow = getMainWindow();
    if (mainWindow) {
      // 1. ネットワークエミュレーションの設定
      mainWindow.webContents.session.enableNetworkEmulation({
        offline: newState,
      });

      // 2. WebRequestによる強制ブロック (localhost以外)
      const filter = { urls: ["*://*/*"] };
      if (newState) {
        session.defaultSession.webRequest.onBeforeRequest(
          filter,
          (details, callback) => {
            if (
              details.url.includes("localhost") ||
              details.url.includes("127.0.0.1")
            ) {
              callback({ cancel: false });
            } else {
              callback({ cancel: true });
            }
          }
        );
      } else {
        session.defaultSession.webRequest.onBeforeRequest(filter, null);
      }

      // レンダラーに通知を送信
      mainWindow.webContents.send("offline-simulation-changed", newState);
    }

    debugLog(
      `[Shortcut] Offline simulation: ${newState ? "ON" : "OFF"} (Ctrl+Shift+O)`
    );
  });

  // Ctrl+Shift+I: DevToolsを開く
  globalShortcut.register("CommandOrControl+Shift+I", () => {
    const mainWindow = getMainWindow();
    if (mainWindow) {
      mainWindow.webContents.openDevTools();
    }
  });

  debugLog("Ctrl+Shift+I = Open DevTools, Ctrl+Shift+O = Toggle Offline Mode");
}

// アプリケーション起動時の処理
async function init() {
  try {
    debugLog("Running migrations from: " + path.join(__dirname, "../drizzle"));
    const db = getDb();

    migrate(db, {
      migrationsFolder: path.join(__dirname, "../drizzle"),
    });
    debugLog("Migrations completed successfully.");
  } catch (error) {
    console.error("Error during migration:", error);
  }
}

// アプリケーションの準備完了時の処理
app.on("ready", async () => {
  await init();
  registerProtocolHandlers();
  setupIPC();

  const isDev = !app.isPackaged;
  debugLog(
    `isDev = ${isDev} process.env.NODE_ENV = ${process.env.NODE_ENV} app.isPackaged = ${app.isPackaged}`
  );

  if (isDev) {
    debugLog("開発モードで起動しています");
    debugLog("ローカル開発サーバー(http://localhost:3000)に接続を試みます...");
    createMainWindow();
  } else {
    debugLog("本番モードで起動しています");
    const staticPath = path.join(__dirname, "../out/index.html");
    debugLog(`静的ファイルを読み込みます: ${staticPath}`);
    createMainWindow();
  }

  setupTray();
  setupDevShortcuts();
});

// すべてのウィンドウが閉じられたときの処理
app.on("window-all-closed", () => {
  if (!isMac) {
    destroyTray();
    app.quit();
  }
});

// アプリケーションがアクティブ化されたときの処理（macOS）
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

// アプリケーション終了時にショートカットを解除
app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});
