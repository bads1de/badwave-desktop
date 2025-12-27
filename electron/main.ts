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
import * as https from "https";
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

  // 音楽ライブラリのデータを保存するためのストアキー
  const MUSIC_LIBRARY_KEY = "music_library";
  const MUSIC_LIBRARY_LAST_SCAN_KEY = "music_library_last_scan";

  // 音楽ライブラリのデータ構造
  interface MusicLibrary {
    directoryPath: string;
    files: {
      [filePath: string]: {
        metadata?: any;
        lastModified: number;
        error?: string;
      };
    };
  }

  // 指定されたフォルダ内のMP3ファイルをスキャン（永続化対応版）
  ipcMain.handle(
    "handle-scan-mp3-files",
    async (_, directoryPath: string, forceFullScan: boolean = false) => {
      try {
        // 前回のスキャン結果を取得
        const savedLibrary = store.get(MUSIC_LIBRARY_KEY) as
          | MusicLibrary
          | undefined;
        const isSameDirectory = savedLibrary?.directoryPath === directoryPath;

        // 差分スキャンを行うかどうかを決定
        const shouldPerformDiffScan = isSameDirectory && !forceFullScan;

        debugLog(
          `[Scan] スキャン開始: ${directoryPath} (差分スキャン: ${shouldPerformDiffScan})`
        );

        // 現在のライブラリ情報を初期化
        const currentLibrary: MusicLibrary = {
          directoryPath,
          files: {},
        };

        // ディレクトリ内のファイルを再帰的に取得する関数
        const scanDirectory = async (dir: string): Promise<string[]> => {
          const entries = await fs.promises.readdir(dir, {
            withFileTypes: true,
          });
          const files: string[] = [];

          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
              // サブディレクトリを再帰的にスキャン
              const subFiles = await scanDirectory(fullPath);
              files.push(...subFiles);
            } else if (
              entry.isFile() &&
              path.extname(entry.name).toLowerCase() === ".mp3"
            ) {
              // MP3ファイルのみを追加
              files.push(fullPath);
            }
          }

          return files;
        };

        // ディレクトリ内のすべてのMP3ファイルを取得
        const allFiles = await scanDirectory(directoryPath);

        // 新しいファイル、変更されたファイル、変更なしのファイルを分類
        const newFiles: string[] = [];
        const modifiedFiles: string[] = [];
        const unchangedFiles: string[] = [];

        for (const filePath of allFiles) {
          const stats = await fs.promises.stat(filePath);
          const lastModified = stats.mtimeMs;

          if (shouldPerformDiffScan && savedLibrary.files[filePath]) {
            // 前回のスキャン結果と比較
            const savedFile = savedLibrary.files[filePath];

            if (savedFile.lastModified === lastModified) {
              // ファイルが変更されていない場合
              unchangedFiles.push(filePath);
              // 前回のメタデータを再利用
              currentLibrary.files[filePath] = savedFile;
            } else {
              // ファイルが変更されている場合
              modifiedFiles.push(filePath);
              // 新しいエントリを作成（メタデータは後で取得）
              currentLibrary.files[filePath] = {
                lastModified,
              };
            }
          } else {
            // 新しいファイルの場合
            newFiles.push(filePath);
            // 新しいエントリを作成（メタデータは後で取得）
            currentLibrary.files[filePath] = {
              lastModified,
            };
          }
        }

        // 削除されたファイルを特定（前回のスキャン結果にあるが、今回のスキャンにないファイル）
        const deletedFiles: string[] = [];
        if (shouldPerformDiffScan) {
          for (const filePath in savedLibrary.files) {
            if (!allFiles.includes(filePath)) {
              deletedFiles.push(filePath);
            }
          }
        }

        // スキャン結果をストアに保存
        store.set(MUSIC_LIBRARY_KEY, currentLibrary);
        store.set(MUSIC_LIBRARY_LAST_SCAN_KEY, new Date().toISOString());

        debugLog(
          `[Scan] スキャン完了: 新規=${newFiles.length}, 変更=${modifiedFiles.length}, 変更なし=${unchangedFiles.length}, 削除=${deletedFiles.length}`
        );

        // スキャン結果を返す
        return {
          files: allFiles,
          scanInfo: {
            newFiles,
            modifiedFiles,
            unchangedFiles,
            deletedFiles,
            isSameDirectory,
            isFullScan: !shouldPerformDiffScan,
          },
        };
      } catch (error: any) {
        debugLog(
          `[Error] MP3ファイルのスキャンに失敗: ${directoryPath}`,
          error
        );
        return { error: error.message };
      }
    }
  );

  // 保存されている音楽ライブラリデータを取得
  ipcMain.handle("handle-get-saved-music-library", async () => {
    try {
      const savedLibrary = store.get(MUSIC_LIBRARY_KEY) as
        | MusicLibrary
        | undefined;
      const lastScan = store.get(MUSIC_LIBRARY_LAST_SCAN_KEY) as
        | string
        | undefined;

      if (!savedLibrary) {
        return { exists: false };
      }

      // ディレクトリが存在するか確認
      let directoryExists = false;
      try {
        await fs.promises.access(savedLibrary.directoryPath);
        directoryExists = true;
      } catch (e) {
        // ディレクトリが存在しない場合
        directoryExists = false;
      }

      return {
        exists: true,
        directoryPath: savedLibrary.directoryPath,
        fileCount: Object.keys(savedLibrary.files).length,
        lastScan,
        directoryExists,
      };
    } catch (error: any) {
      debugLog(`[Error] 保存された音楽ライブラリの取得に失敗:`, error);
      return { error: error.message };
    }
  });

  // MP3ファイルのメタデータを取得
  ipcMain.handle("handle-get-mp3-metadata", async (_, filePath: string) => {
    try {
      // 保存されているライブラリデータを取得
      const savedLibrary = store.get(MUSIC_LIBRARY_KEY) as
        | MusicLibrary
        | undefined;

      // ファイルの最終更新日時を取得
      const stats = await fs.promises.stat(filePath);
      const lastModified = stats.mtimeMs;

      // 保存されているメタデータがあり、ファイルが変更されていない場合は保存されているメタデータを返す
      if (
        savedLibrary &&
        savedLibrary.files[filePath] &&
        savedLibrary.files[filePath].metadata &&
        savedLibrary.files[filePath].lastModified === lastModified
      ) {
        return {
          metadata: savedLibrary.files[filePath].metadata,
          fromCache: true,
        };
      }

      // メタデータを取得
      const metadata = await mm.parseFile(filePath);

      // ライブラリデータを更新
      if (savedLibrary) {
        if (!savedLibrary.files[filePath]) {
          savedLibrary.files[filePath] = { lastModified };
        }

        savedLibrary.files[filePath].metadata = metadata;
        savedLibrary.files[filePath].lastModified = lastModified;
        delete savedLibrary.files[filePath].error;

        // 更新したライブラリデータを保存
        store.set(MUSIC_LIBRARY_KEY, savedLibrary);
      }

      return { metadata, fromCache: false };
    } catch (error: any) {
      debugLog(`[Error] メタデータの取得に失敗: ${filePath}`, error);

      // エラー情報をライブラリデータに保存
      const savedLibrary = store.get(MUSIC_LIBRARY_KEY) as
        | MusicLibrary
        | undefined;
      if (savedLibrary && savedLibrary.files[filePath]) {
        savedLibrary.files[filePath].error = error.message;
        store.set(MUSIC_LIBRARY_KEY, savedLibrary);
      }

      return { error: error.message };
    }
  });

  // ---------------------------------------------------------
  // ダウンロード機能
  // ---------------------------------------------------------

  // 曲のダウンロード
  ipcMain.handle(
    "download-song",
    async (event, url: string, filename: string) => {
      try {
        const userDataPath = app.getPath("userData");
        const downloadsDir = path.join(userDataPath, "downloads");

        // ダウンロードフォルダがなければ作成
        if (!fs.existsSync(downloadsDir)) {
          await fs.promises.mkdir(downloadsDir, { recursive: true });
        }

        const filePath = path.join(downloadsDir, filename);
        debugLog(`[Download] Starting download: ${url} -> ${filePath}`);

        return new Promise((resolve, reject) => {
          const file = fs.createWriteStream(filePath);

          https
            .get(url, (response) => {
              if (response.statusCode !== 200) {
                fs.unlink(filePath, () => {}); // ゴミ掃除
                reject(new Error(`Status Code: ${response.statusCode}`));
                return;
              }

              const totalSize = parseInt(
                response.headers["content-length"] || "0",
                10
              );
              let downloadedSize = 0;

              response.on("data", (chunk) => {
                downloadedSize += chunk.length;
                if (totalSize > 0) {
                  const progress = Math.round(
                    (downloadedSize / totalSize) * 100
                  );
                  // 進捗を送信
                  event.sender.send("download-progress", progress);
                }
              });

              response.pipe(file);

              file.on("finish", () => {
                file.close(() => {
                  debugLog(`[Download] Completed: ${filePath}`);
                  resolve(filePath);
                });
              });
            })
            .on("error", (err) => {
              fs.unlink(filePath, () => {});
              reject(err);
            });
        });
      } catch (error: any) {
        debugLog(`[Download] Error:`, error);
        throw error;
      }
    }
  );

  // ファイル存在確認
  ipcMain.handle("check-file-exists", async (_, filename: string) => {
    const userDataPath = app.getPath("userData");
    const filePath = path.join(userDataPath, "downloads", filename);
    try {
      await fs.promises.access(filePath);
      return true;
    } catch {
      return false;
    }
  });

  // ローカルファイルのパスを取得
  ipcMain.handle("get-local-file-path", (_, filename: string) => {
    const userDataPath = app.getPath("userData");
    // appプロトコルで読めるように絶対パスを返す
    return path.join(userDataPath, "downloads", filename);
  });

  // ファイル削除
  ipcMain.handle("delete-song", async (_, filename: string) => {
    const userDataPath = app.getPath("userData");
    const filePath = path.join(userDataPath, "downloads", filename);
    try {
      await fs.promises.unlink(filePath);
      return true;
    } catch (error) {
      debugLog(`[Delete] Error:`, error);
      return false;
    }
  });
}

// アプリケーションの初期化
app.whenReady().then(() => {
  // プロトコルハンドラーの登録
  registerProtocolHandlers();

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
  if (tray) {
    tray.destroy();
  }
});
