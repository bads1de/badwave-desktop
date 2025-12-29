import { app, BrowserWindow, globalShortcut, session } from "electron";
import * as path from "path";
import { loadEnvVariables, debugLog } from "./utils";
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
import { setupDevShortcuts } from "./shortcuts";
import { runMigrations } from "./db/migrate";

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

// アプリケーションの準備完了時の処理
app.on("ready", async () => {
  await runMigrations();
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
