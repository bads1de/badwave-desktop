import { ipcMain, app } from "electron";
import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import { debugLog } from "../utils";

export function setupSimpleDownloadHandlers() {
  // 曲のダウンロード
  // 注意: offline.tsのsetupDownloadHandlersとチャンネル名が重複する可能性があります
  // どちらか一方のみを使用してください
  ipcMain.handle(
    "download-song-simple", // チャンネル名を変更して競合を回避
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
