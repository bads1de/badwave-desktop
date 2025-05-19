import {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  Tray,
  nativeImage,
  shell,
  protocol,
} from "electron";
import * as path from "path";
import * as url from "url";
import * as fs from "fs";
import { loadEnvVariables, isDev, debugLog } from "./utils";

// 環境変数を読み込む
loadEnvVariables();

// electron-serveとelectron-storeをインポート
import serve from "electron-serve";
import Store from "electron-store";

// プラットフォーム判定
const isMac = process.platform === "darwin";

// 設定ストアの初期化
const store = new Store({
  name: "badwave-settings", // 設定ファイルの名前
  clearInvalidConfig: true, // 無効な設定を自動的にクリア
  // 開発モードでも同じ場所に保存するための設定
  cwd: app.getPath("userData"),
});

// 静的ファイル配信のセットアップ（本番環境用）
const serveURL = serve({
  directory: path.join(__dirname, "../.next"),
});

// グローバル参照を保持（ガベージコレクションを防ぐため）
let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

// プロトコルハンドラーの登録
function registerProtocolHandlers() {
  // appプロトコルのハンドラー
  registerAppProtocol();

  // fileプロトコルのインターセプト
  interceptFileProtocol();
}

// appプロトコルのハンドラーを登録
function registerAppProtocol() {
  protocol.registerFileProtocol(
    "app",
    (
      request: Electron.ProtocolRequest,
      callback: (response: string) => void
    ) => {
      const filePath = url.fileURLToPath(
        "file://" + request.url.slice("app://".length)
      );
      callback(filePath);
    }
  );
}

// fileプロトコルをインターセプト（Next.jsの静的ファイル用）
function interceptFileProtocol() {
  protocol.interceptFileProtocol(
    "file",
    (
      request: Electron.ProtocolRequest,
      callback: (response: string) => void
    ) => {
      const requestedUrl = request.url.slice("file://".length);

      if (path.isAbsolute(requestedUrl)) {
        const normalizedPath = path.normalize(
          path.join(__dirname, "../out", decodeURI(requestedUrl))
        );
        callback(normalizedPath);
      } else {
        callback(decodeURI(requestedUrl));
      }
    }
  );
}

// メインウィンドウの作成
async function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
    // macOSでは背景色を設定しないとタイトルバーが白くなる
    backgroundColor: "#121212",
    // タイトルバーをカスタマイズ
    titleBarStyle: isMac ? "hiddenInset" : "default",
    // Windowsではフレームレスにする
    frame: isMac ? true : false,
    // アプリケーションアイコンを設定
    icon: path.join(__dirname, "../public/logo.png"),
  });

  // 外部リンクをデフォルトブラウザで開く
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  // 開発モードの場合
  if (isDev) {
    // DevToolsを開く（必要に応じてコメントアウト）
    mainWindow.webContents.openDevTools();

    try {
      // 開発サーバーが起動しているか確認
      await mainWindow.loadURL("http://localhost:3000");
      console.log("開発サーバーに接続しました");
    } catch (err) {
      console.error("開発サーバーへの接続に失敗しました:", err);
      console.log("デプロイ済みのURLに接続を試みます...");

      try {
        // デプロイ済みのURLに接続
        await mainWindow.loadURL("https://bad-wave.vercel.app/");
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
    try {
      console.log("本番モードで起動しています");
      // 静的ファイルの配信を試みる
      await serveURL(mainWindow);
    } catch (err) {
      console.error("静的ファイル配信中にエラーが発生しました:", err);

      // エラーが発生した場合は、ローカルのHTMLファイルを表示
      const indexPath = path.join(
        __dirname,
        "../.next/server/pages/index.html"
      );
      if (fs.existsSync(indexPath)) {
        await mainWindow.loadFile(indexPath);
      } else {
        console.log(
          "ローカルのHTMLファイルが見つかりません。デプロイ済みのURLに接続を試みます..."
        );

        try {
          // デプロイ済みのURLに接続
          await mainWindow.loadURL("https://bad-wave.vercel.app/");
          console.log("デプロイ済みのURLに接続しました");
        } catch (deployErr) {
          console.error(
            "デプロイ済みのURLへの接続にも失敗しました:",
            deployErr
          );
          // 両方とも失敗した場合はエラーメッセージを表示
          await mainWindow.loadURL(
            "data:text/html;charset=utf-8," +
              encodeURIComponent(
                "<html><body><h1>エラー</h1><p>アプリケーションの起動に失敗しました。</p><p>インターネット接続を確認してください。</p></body></html>"
              )
          );
        }
      }
    }
  }

  // ウィンドウが閉じられたときの処理
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// システムトレイの設定
function setupTray() {
  // SVGファイルが存在する場合はそれを使用し、なければPNGにフォールバック
  const iconPath = fs.existsSync(path.join(__dirname, "../public/logo.svg"))
    ? path.join(__dirname, "../public/logo.svg")
    : path.join(__dirname, "../public/logo.png");

  const icon = nativeImage
    .createFromPath(iconPath)
    .resize({ width: 16, height: 16 });

  tray = new Tray(icon);
  const contextMenu = Menu.buildFromTemplate([
    { label: "BadMusicApp", enabled: false },
    { type: "separator" },
    {
      label: "再生/一時停止",
      click: () => {
        mainWindow?.webContents.send("media-control", "play-pause");
      },
    },
    {
      label: "次の曲",
      click: () => {
        mainWindow?.webContents.send("media-control", "next");
      },
    },
    {
      label: "前の曲",
      click: () => {
        mainWindow?.webContents.send("media-control", "previous");
      },
    },
    { type: "separator" },
    {
      label: "アプリを表示",
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        } else {
          createMainWindow();
        }
      },
    },
    {
      label: "終了",
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setToolTip("BadMusicApp");
  tray.setContextMenu(contextMenu);

  // トレイアイコンのクリックでウィンドウを表示/非表示
  tray.on("click", () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    } else {
      createMainWindow();
    }
  });
}

// IPC通信のセットアップ
function setupIPC() {
  // アプリケーション設定の取得
  ipcMain.handle("get-store-value", (_, key: string) => {
    const value = store.get(key);
    debugLog(`[Store] 設定値を取得: ${key} =`, value);
    return value;
  });

  // アプリケーション設定の保存
  ipcMain.handle("set-store-value", (_, key: string, value: any) => {
    debugLog(`[Store] 設定値を保存: ${key} =`, value);
    store.set(key, value);

    // 開発環境のみ、保存後の確認ログを出力
    if (isDev) {
      // 保存後に値を再取得して確認（デバッグ用）
      const savedValue = store.get(key);
      debugLog(`[Store] 保存後の値を確認: ${key} =`, savedValue);

      // ストア全体の内容をログに出力（デバッグ用）
      debugLog("[Store] 現在のストア内容:", store.store);
    }

    return true;
  });

  // ウィンドウ制御
  ipcMain.handle("window-minimize", () => {
    mainWindow?.minimize();
  });

  ipcMain.handle("window-maximize", () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });

  ipcMain.handle("window-close", () => {
    mainWindow?.hide();
  });
}

// アプリケーションの初期化
app.whenReady().then(() => {
  // プロトコルハンドラーの登録
  registerProtocolHandlers();

  // メインウィンドウの作成
  createMainWindow();

  // システムトレイの設定
  setupTray();

  // IPC通信のセットアップ
  setupIPC();

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
  if (tray) {
    tray.destroy();
  }
});
