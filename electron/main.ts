import {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  Tray,
  nativeImage,
  shell,
  protocol,
  dialog,
} from "electron";
import * as path from "path";
import * as url from "url";
import * as fs from "fs";
import * as mm from "music-metadata";
import { loadEnvVariables, isDev, debugLog } from "./utils";

// 環境変数を読み込む
loadEnvVariables();

// electron-storeをインポート
import Store from "electron-store";

// プラットフォーム判定
const isMac = process.platform === "darwin";

// 設定ストアの初期化
const store = new Store({
  name: "badwave-settings", // 設定ファイルの名前
  clearInvalidConfig: true, // 無効な設定を自動的にクリア
  cwd: app.getPath("userData"), // 開発モードでも同じ場所に保存するための設定
});

// グローバル参照を保持（ガベージコレクションを防ぐため）
let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

// プロトコルハンドラーの登録
function registerProtocolHandlers() {
  // appプロトコルのハンドラー
  registerAppProtocol();
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
      webSecurity: false, // ローカルファイルの読み込みを許可
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
}

// システムトレイの設定
function setupTray() {
  try {
    // 利用可能なすべてのパスを試す
    const possiblePaths = [];

    // 開発環境のパス
    const appPath = app.getAppPath();
    possiblePaths.push(path.join(appPath, "public", "logo.png"));

    // 本番環境の可能性のあるパス
    if (app.isPackaged) {
      const resourcePath = process.resourcesPath;
      const exePath = path.dirname(app.getPath("exe"));

      // リソースディレクトリ内のパス
      possiblePaths.push(
        path.join(resourcePath, "app.asar.unpacked", "public", "logo.png")
      );
      possiblePaths.push(
        path.join(resourcePath, "app.asar.unpacked", "build", "logo.png")
      );
      possiblePaths.push(path.join(resourcePath, "logo.png"));

      // 実行ファイルディレクトリ内のパス
      possiblePaths.push(path.join(exePath, "resources", "logo.png"));
      possiblePaths.push(
        path.join(
          exePath,
          "resources",
          "app.asar.unpacked",
          "public",
          "logo.png"
        )
      );
      possiblePaths.push(path.join(exePath, "public", "logo.png"));

      // その他の可能性のあるパス
      possiblePaths.push(path.join(resourcePath, "public", "logo.png"));
      possiblePaths.push(path.join(resourcePath, "..", "public", "logo.png"));
      possiblePaths.push(
        path.join(exePath, "..", "resources", "public", "logo.png")
      );
    }

    // 存在するパスを見つける
    let pngPath = null;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        pngPath = p;
        break;
      }
    }

    // ファイルの存在確認
    if (!pngPath || !fs.existsSync(pngPath)) {
      throw new Error(`アイコンファイルが見つかりません`);
    }

    // nativeImageを作成
    let icon;
    try {
      // ファイルの内容を読み込んでバッファとして保持
      const iconBuffer = fs.readFileSync(pngPath);

      // バッファからnativeImageを作成
      icon = nativeImage.createFromBuffer(iconBuffer);

      // アイコンが空でないか確認
      if (icon.isEmpty()) {
        throw new Error("アイコンイメージが空です");
      }

      // アイコンをリサイズ（システムトレイに適したサイズに）
      icon = icon.resize({
        width: 24,
        height: 24,
        quality: "best",
      });
    } catch (imgError) {
      // 代替方法: 組み込みのアイコンを使用
      try {
        // Electronの組み込みアイコンを使用
        const electronPath = require.resolve("electron");
        const electronDir = path.dirname(electronPath);
        const defaultIconPath = path.join(
          electronDir,
          "default_app.asar",
          "icon.png"
        );

        if (fs.existsSync(defaultIconPath)) {
          icon = nativeImage.createFromPath(defaultIconPath);
        } else {
          icon = nativeImage.createEmpty();
        }
      } catch (fallbackError) {
        // 最終手段: 空のイメージを作成
        icon = nativeImage.createEmpty();
      }
    }

    // トレイを作成
    tray = new Tray(icon);

    // コンテキストメニューを作成
    try {
      // メニューテンプレートを作成
      const menuTemplate: Electron.MenuItemConstructorOptions[] = [
        { label: "BadWave", enabled: false },
        { type: "separator" },
        {
          label: "再生/一時停止",
          click: () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send("media-control", "play-pause");
            }
          },
        },
        {
          label: "次の曲",
          click: () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send("media-control", "next");
            }
          },
        },
        {
          label: "前の曲",
          click: () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send("media-control", "previous");
            }
          },
        },
        { type: "separator" },
        {
          label: "アプリを表示",
          click: () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
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
      ];

      // メニューを構築
      const contextMenu = Menu.buildFromTemplate(menuTemplate);

      // トレイにメニューを設定
      tray.setToolTip("BadWave");
      tray.setContextMenu(contextMenu);

      // トレイアイコンのクリックでウィンドウを表示/非表示
      tray.on("click", () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
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
    } catch (menuError) {
      // エラーが発生した場合でもアプリケーションは続行
    }
  } catch (error) {
    // エラーが発生した場合でもアプリケーションは続行
    // 空のトレイオブジェクトを作成して最低限の機能を提供
    try {
      if (!tray) {
        // Base64エンコードされた最小限のアイコン（1x1ピクセルの透明PNG）
        const transparentPixel =
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
        const iconBuffer = Buffer.from(transparentPixel, "base64");

        try {
          const emptyIcon = nativeImage.createFromBuffer(iconBuffer);
          tray = new Tray(emptyIcon);
        } catch (iconError) {
          const emptyIcon = nativeImage.createEmpty();
          tray = new Tray(emptyIcon);
        }

        tray.setToolTip("BadWave");

        // 最小限のコンテキストメニュー
        const fallbackMenu = Menu.buildFromTemplate([
          {
            label: "BadWave",
            enabled: false,
          } as Electron.MenuItemConstructorOptions,
          { type: "separator" } as Electron.MenuItemConstructorOptions,
          {
            label: "アプリを表示",
            click: () => {
              if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.show();
                mainWindow.focus();
              } else {
                createMainWindow();
              }
            },
          } as Electron.MenuItemConstructorOptions,
          {
            label: "終了",
            click: () => {
              app.quit();
            },
          } as Electron.MenuItemConstructorOptions,
        ]);

        tray.setContextMenu(fallbackMenu);
      }
    } catch (fallbackError) {
      // フォールバックトレイの作成に失敗した場合も続行
    }
  }
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

  // フォルダ選択ダイアログの表示
  ipcMain.handle("handle-select-directory", async () => {
    if (!mainWindow) {
      return { error: "Main window not available" };
    }
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openDirectory"],
    });
    if (result.canceled) {
      return { canceled: true };
    } else {
      return { filePath: result.filePaths[0] };
    }
  });

  // 指定されたフォルダ内のMP3ファイルをスキャン
  ipcMain.handle("handle-scan-mp3-files", async (_, directoryPath: string) => {
    try {
      const files = await fs.promises.readdir(directoryPath);
      const mp3Files = files.filter(
        (file) => path.extname(file).toLowerCase() === ".mp3"
      );
      return {
        files: mp3Files.map((file) => path.join(directoryPath, file)),
      };
    } catch (error: any) {
      debugLog(`[Error] MP3ファイルのスキャンに失敗: ${directoryPath}`, error);
      return { error: error.message };
    }
  });

  // MP3ファイルのメタデータを取得
  ipcMain.handle("handle-get-mp3-metadata", async (_, filePath: string) => {
    try {
      const metadata = await mm.parseFile(filePath);
      return { metadata };
    } catch (error: any) {
      debugLog(`[Error] メタデータの取得に失敗: ${filePath}`, error);
      return { error: error.message };
    }
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
