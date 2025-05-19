import { app, autoUpdater, dialog, BrowserWindow } from "electron";
import * as os from "os";
import { isDev } from "./utils";

/**
 * 自動アップデート機能の設定
 * @param mainWindow メインウィンドウのインスタンス
 */
export function setupAutoUpdater(mainWindow: BrowserWindow) {
  // 開発モードでは自動アップデートを無効化
  if (isDev) {
    console.log("開発モードのため、自動アップデートは無効化されています");
    return;
  }

  // macOSの場合は署名が必要
  if (process.platform === "darwin") {
    // アップデートサーバーのURL
    // 実際のURLに置き換える必要があります
    autoUpdater.setFeedURL({
      url: `https://your-update-server.com/update/${
        process.platform
      }/${app.getVersion()}`,
      headers: {
        "User-Agent": `${app.getName()}/${app.getVersion()} (${os.platform()} ${os.arch()})`,
      },
    });
  }

  // アップデートのチェック間隔（1時間）
  const CHECK_INTERVAL = 60 * 60 * 1000;

  // 定期的にアップデートをチェック
  setInterval(() => {
    checkForUpdates();
  }, CHECK_INTERVAL);

  // 起動時に一度チェック
  checkForUpdates();

  // アップデートが利用可能になったとき
  autoUpdater.on("update-available", () => {
    console.log("アップデートが利用可能です");

    // メインウィンドウにアップデート情報を送信
    mainWindow.webContents.send("update-available");
  });

  // アップデートのダウンロード進捗
  // @ts-ignore - Electronの型定義が不完全なため
  autoUpdater.on("download-progress", (progressObj) => {
    console.log(`ダウンロード進捗: ${progressObj.percent}%`);

    // メインウィンドウにダウンロード進捗を送信
    mainWindow.webContents.send("download-progress", progressObj);
  });

  // アップデートのダウンロードが完了したとき
  autoUpdater.on("update-downloaded", (_event, releaseNotes, releaseName) => {
    console.log("アップデートのダウンロードが完了しました");

    // メインウィンドウにアップデート完了を通知
    mainWindow.webContents.send("update-downloaded", {
      releaseNotes,
      releaseName,
    });

    // ダイアログを表示
    const dialogOpts = {
      type: "info" as const,
      buttons: ["再起動", "後で"],
      title: "アプリケーションアップデート",
      message: process.platform === "win32" ? releaseNotes : releaseName,
      detail:
        "アップデートがダウンロードされました。アプリケーションを再起動して適用しますか？",
    };

    dialog.showMessageBox(dialogOpts).then((returnValue) => {
      if (returnValue.response === 0) {
        // 「再起動」ボタンが押された場合
        autoUpdater.quitAndInstall();
      }
    });
  });

  // エラーが発生したとき
  autoUpdater.on("error", (error) => {
    console.error("アップデート中にエラーが発生しました:", error);
  });
}

/**
 * アップデートをチェックする共通関数
 *
 * @param {boolean} isManual - 手動チェックかどうか
 * @returns {boolean} アップデートのチェックが開始されたかどうか
 */
function checkForUpdatesCore(isManual: boolean = false): boolean {
  try {
    // 開発モードではアップデートチェックをスキップ
    if (isDev) {
      console.log("開発モードのため、アップデートチェックをスキップします");
      return true;
    }

    // アップデートURLが設定されているか確認
    // 開発中は警告を表示するだけで続行
    if (!process.env.UPDATE_SERVER_URL) {
      console.warn(
        "アップデートURLが設定されていません - 開発モードでは無視されます"
      );
      return true; // 開発モードでは成功として扱う
    }

    autoUpdater.checkForUpdates();
    return true;
  } catch (error) {
    const errorMessage = isManual
      ? "手動アップデートチェック中にエラーが発生しました:"
      : "アップデートのチェック中にエラーが発生しました:";
    console.error(errorMessage, error);
    return false;
  }
}

/**
 * 自動アップデートをチェックする
 * 戻り値を返さないバージョン（定期チェック用）
 */
function checkForUpdates() {
  checkForUpdatesCore(false);
}

/**
 * 手動でアップデートをチェックする
 * @returns アップデートのチェックが開始されたかどうか
 */
export function manualCheckForUpdates(): boolean {
  return checkForUpdatesCore(true);
}
