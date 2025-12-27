import { app, BrowserWindow } from "electron";
import * as path from "path";
import { loadEnvVariables, debugLog } from "./utils";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { getDb } from "./db/client";

// モジュールのインポート
import { registerProtocolHandlers } from "./lib/protocol";
import { createMainWindow } from "./lib/window-manager";
import { setupTray, destroyTray } from "./lib/tray";

// IPCハンドラーのインポート
import { setupDownloadHandlers } from "./ipc/offline";
import { setupSettingsHandlers } from "./ipc/settings";
import { setupWindowHandlers } from "./ipc/window";
import { setupDialogHandlers } from "./ipc/dialog";
import { setupLibraryHandlers } from "./ipc/library";
import { setupSimpleDownloadHandlers } from "./ipc/simple_download";

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
});
