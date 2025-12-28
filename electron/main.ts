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
import { setupSettingsHandlers } from "./ipc/settings";
import { setupWindowHandlers } from "./ipc/window";
import { setupDialogHandlers } from "./ipc/dialog";
import { setupLibraryHandlers } from "./ipc/library";
import { setupSimpleDownloadHandlers } from "./ipc/simple_download";
import { setupCacheHandlers } from "./ipc/cache";

// 環境変数を読み込む
loadEnvVariables();

// プラットフォーム判定
const isMac = process.platform === "darwin";

// オフラインシミュレーション状態
let isSimulatingOffline = false;

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
}

// 開発用ショートカットキーのセットアップ
function setupDevShortcuts() {
  // Ctrl+Shift+O: オフラインモードのトグル
  globalShortcut.register("CommandOrControl+Shift+O", () => {
    isSimulatingOffline = !isSimulatingOffline;

    const mainWindow = getMainWindow();
    if (mainWindow) {
      // 1. ネットワークエミュレーションの設定
      mainWindow.webContents.session.enableNetworkEmulation({
        offline: isSimulatingOffline,
      });

      // 2. WebRequestによる強制ブロック (localhost以外)
      const filter = { urls: ["*://*/*"] };
      if (isSimulatingOffline) {
        session.defaultSession.webRequest.onBeforeRequest(
          filter,
          (details, callback) => {
            // localhost (開発サーバー) の通信だけは許可しないとアプリが白目剥く
            if (
              details.url.includes("localhost") ||
              details.url.includes("127.0.0.1")
            ) {
              callback({ cancel: false });
            } else {
              // それ以外（Supabase等）はすべて即座にキャンセル
              callback({ cancel: true });
            }
          }
        );
      } else {
        // オンライン時は制限解除
        session.defaultSession.webRequest.onBeforeRequest(filter, null);
      }

      // レンダラーに通知を送信
      mainWindow.webContents.send(
        "offline-simulation-changed",
        isSimulatingOffline
      );
    }

    debugLog(
      `[Shortcut] Offline simulation: ${
        isSimulatingOffline ? "ON" : "OFF"
      } (Ctrl+Shift+O)`
    );
  });

  debugLog("[Dev] Shortcuts registered: Ctrl+Shift+O = Toggle Offline Mode");
}

// アプリケーションの初期化
app.whenReady().then(() => {
  // プロトコルハンドラーの登録
  registerProtocolHandlers();

  // Run Database Migrations
  try {
    const db = getDb();
    const migrationsFolder = app.isPackaged
      ? path.join(process.resourcesPath, "drizzle")
      : path.join(__dirname, "../drizzle");

    debugLog(`Running migrations from: ${migrationsFolder}`);
    migrate(db, { migrationsFolder });
    debugLog("Migrations completed successfully.");
  } catch (error) {
    console.error("Database migration failed:", error);
  }

  // IPC通信のセットアップ（ウィンドウ作成前に行う必要がある）
  setupIPC();

  // メインウィンドウの作成
  createMainWindow();

  // システムトレイの設定
  setupTray();

  // 開発用ショートカットキーのセットアップ
  setupDevShortcuts();

  app.on("activate", () => {
    // macOSでは、Dockアイコンクリック時に
    // ウィンドウがない場合は新しいウィンドウを作成
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

// すべてのウィンドウが閉じられたときの処理
app.on("window-all-closed", () => {
  // macOSでは、ユーザーがCmd + Qで明示的に終了するまで
  // アプリケーションを終了しないのが一般的
  if (!isMac) {
    app.quit();
  }
});

// アプリケーションの終了処理
app.on("before-quit", () => {
  destroyTray();
  // グローバルショートカットを解除
  globalShortcut.unregisterAll();
});
