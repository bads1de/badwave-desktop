import { BrowserWindow, shell, app } from "electron";
import * as path from "path";
import { isDev, debugLog } from "../utils";
import { startNextServer, getServerPort, stopNextServer } from "./server";

// グローバル参照を保持（ガベージコレクションを防ぐため）
let mainWindow: BrowserWindow | null = null;

// メインウィンドウの取得
export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}

// メインウィンドウの作成
export async function createMainWindow() {
  const isMac = process.platform === "darwin";

  mainWindow = new BrowserWindow({
    width: 1600,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "../preload/index.js"),
      webSecurity: false, // ローカルファイルの読み込みを許可
    },
    // macOSでは背景色を設定しないとタイトルバーが白くなる
    backgroundColor: "#121212",
    // タイトルバーをカスタマイズ
    titleBarStyle: isMac ? "hiddenInset" : "default",
    // Windowsではフレームレスにする
    frame: isMac ? true : false,
    // アプリケーションアイコンを設定
    icon: path.join(__dirname, "../../public/logo.png"),
  });

  // 外部リンクをデフォルトブラウザで開く
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  // 開発モードの場合
  if (isDev) {
    debugLog(
      `isDev = ${isDev}, process.env.NODE_ENV = ${process.env.NODE_ENV}, app.isPackaged = ${app.isPackaged}`
    );
    debugLog("開発モードで起動しています");
    mainWindow.webContents.openDevTools();

    try {
      // 開発サーバーが起動しているか確認
      debugLog(
        "ローカル開発サーバー(http://localhost:3000)に接続を試みます..."
      );
      await mainWindow.loadURL("http://localhost:3000");
      debugLog("開発サーバーに接続しました");
    } catch (err) {
      console.error("開発サーバーへの接続に失敗しました:", err);
      // 開発モードでは開発サーバーが必須
      await mainWindow.loadURL(
        "data:text/html;charset=utf-8," +
          encodeURIComponent(
            `<html>
              <head><style>body{background:#121212;color:#fff;font-family:sans-serif;padding:40px;}</style></head>
              <body>
                <h1>開発サーバーに接続できません</h1>
                <p>別のターミナルで <code>npm run dev</code> を実行してから、アプリを再起動してください。</p>
              </body>
            </html>`
          )
      );
    }
  }
  // 本番モードの場合: Standaloneサーバーを起動
  else {
    debugLog("本番モードで起動しています - Standaloneサーバーを起動します");
    mainWindow.webContents.closeDevTools();

    try {
      // Next.js Standaloneサーバーを起動
      const port = await startNextServer();
      debugLog(`Standaloneサーバーがポート ${port} で起動しました`);

      // ローカルサーバーに接続
      await mainWindow.loadURL(`http://localhost:${port}`);
      debugLog("Standaloneサーバーに接続しました");
    } catch (err) {
      console.error("Standaloneサーバーの起動に失敗しました:", err);
      await mainWindow.loadURL(
        "data:text/html;charset=utf-8," +
          encodeURIComponent(
            `<html>
              <head><style>body{background:#121212;color:#fff;font-family:sans-serif;padding:40px;}</style></head>
              <body>
                <h1>アプリケーションの起動に失敗しました</h1>
                <p>アプリケーションを再インストールしてください。</p>
                <p>エラー: ${err}</p>
              </body>
            </html>`
          )
      );
    }
  }

  // ウィンドウが閉じられたときの処理
  mainWindow.on("closed", () => {
    mainWindow = null;
    // 本番モードの場合、サーバーも停止
    if (!isDev) {
      stopNextServer();
    }
  });

  return mainWindow;
}
