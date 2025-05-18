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
import * as dotenv from "dotenv";
import { setupAutoUpdater, manualCheckForUpdates } from "./updater";
import { setupAuth } from "./auth";

// .env.localファイルを読み込む
const envPath = path.join(app.getAppPath(), ".env.local");
if (fs.existsSync(envPath)) {
  console.log("Loading environment variables from:", envPath);
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  for (const key in envConfig) {
    process.env[key] = envConfig[key];
  }
} else {
  console.warn(".env.localファイルが見つかりません:", envPath);
}

// electron-serveとelectron-storeをインポート
import serve from "electron-serve";
import Store from "electron-store";

// 開発モードかどうかを判定
const isDev = process.env.NODE_ENV !== "production" || !app.isPackaged;
const isMac = process.platform === "darwin";

// 設定ストアの初期化
const store = new Store();

// 静的ファイル配信のセットアップ（本番環境用）
const serveURL = serve({
  directory: path.join(__dirname, "../.next"),
});

// グローバル参照を保持（ガベージコレクションを防ぐため）
let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

// プロトコルハンドラーの登録
function registerProtocolHandlers() {
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

  // file プロトコルのインターセプト（Next.jsの静的ファイル用）
  protocol.interceptFileProtocol(
    "file",
    (
      request: Electron.ProtocolRequest,
      callback: (response: string) => void
    ) => {
      const requestedUrl = request.url.slice("file://".length);
      if (path.isAbsolute(requestedUrl)) {
        callback(
          path.normalize(
            path.join(__dirname, "../out", decodeURI(requestedUrl))
          )
        );
      } else {
        callback(decodeURI(requestedUrl));
      }
    }
  );
}

// メインウィンドウの作成
async function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
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
      // 開発サーバーが起動していない場合は、エラーメッセージを表示
      await mainWindow.loadURL(
        "data:text/html;charset=utf-8," +
          encodeURIComponent(
            "<html><body><h1>エラー</h1><p>開発サーバーに接続できませんでした。</p><p>「npm run dev」を実行して開発サーバーを起動してください。</p></body></html>"
          )
      );
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
        // ファイルが見つからない場合はエラーメッセージを表示
        await mainWindow.loadURL(
          "data:text/html;charset=utf-8," +
            encodeURIComponent(
              "<html><body><h1>エラー</h1><p>アプリケーションの起動に失敗しました。</p><p>「npm run build」を実行してアプリケーションをビルドしてください。</p></body></html>"
            )
        );
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
  const icon = nativeImage
    .createFromPath(path.join(__dirname, "../public/logo.png"))
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
    return store.get(key);
  });

  // アプリケーション設定の保存
  ipcMain.handle("set-store-value", (_, key: string, value: any) => {
    store.set(key, value);
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

  // 手動アップデートチェック
  ipcMain.handle("check-for-updates", () => {
    return manualCheckForUpdates();
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

  // 自動アップデートの設定
  if (mainWindow) {
    setupAutoUpdater(mainWindow);
    // 認証処理の設定
    setupAuth(mainWindow);
  }

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
