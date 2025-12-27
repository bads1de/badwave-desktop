import { BrowserWindow, shell, app } from "electron";
import * as path from "path";
import { isDev } from "../utils";

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
    console.log(
      "isDev =",
      isDev,
      "process.env.NODE_ENV =",
      process.env.NODE_ENV,
      "app.isPackaged =",
      app.isPackaged
    );
  }

  if (isDev) {
    console.log("開発モードで起動しています");
    mainWindow.webContents.openDevTools();

    try {
      // 開発サーバーが起動しているか確認
      console.log(
        "ローカル開発サーバー(http://localhost:3000)に接続を試みます..."
      );
      await mainWindow.loadURL("http://localhost:3000");
      console.log("開発サーバーに接続しました");
    } catch (err) {
      console.error("開発サーバーへの接続に失敗しました:", err);
      console.log("デプロイ済みのURLに接続を試みます...");

      try {
        // デプロイ済みのURLに接続
        await mainWindow.loadURL("https://badwave-desktop.vercel.app/");
        console.log("デプロイ済みのURLに接続しました");
      } catch (deployErr) {
        console.error("デプロイ済みのURLへの接続にも失敗しました:", deployErr);
        // 両方とも失敗した場合はエラーメッセージを表示
        await mainWindow.loadURL(
          "data:text/html;charset=utf-8," +
            encodeURIComponent(
              "<html><body><h1>エラー</h1><p>開発サーバーとデプロイ済みのURLどちらにも接続できませんでした。</p><p>インターネット接続を確認してください。</p></body></html>"
            )
        );
      }
    }
  }
  // 本番モードの場合
  else {
    // 本番モードではDevToolsを開かない
    mainWindow.webContents.closeDevTools();

    // 本番モードでのログは最小限に
    try {
      // 外部URLに直接接続
      await mainWindow.loadURL("https://badwave-desktop.vercel.app/");
    } catch (err) {
      // 接続に失敗した場合はエラーメッセージを表示
      await mainWindow.loadURL(
        "data:text/html;charset=utf-8," +
          encodeURIComponent(
            "<html><body><h1>エラー</h1><p>アプリケーションの起動に失敗しました。</p><p>インターネット接続を確認してください。</p></body></html>"
          )
      );
    }
  }

  // ウィンドウが閉じられたときの処理
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  return mainWindow;
}