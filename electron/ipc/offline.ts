import { ipcMain, app } from "electron";
import fs from "fs";
import path from "path";
import https from "https";
import http from "http";
import { fileURLToPath } from "url";
import { debugLog, toLocalPath } from "../utils";
import { getDb } from "../db/client";
import { songs } from "../db/schema";
import { eq, isNotNull } from "drizzle-orm";

/**
 * DBスキーマと互換性のある楽曲データ型
 * IPC通信時の型安全性を確保しつつ、フィールドのバリデーションに使用
 */
interface SongDownloadPayload {
  id: string;
  userId: string;
  title: string;
  author: string;
  song_path: string;
  image_path: string;
  duration?: number;
  genre?: string;
  lyrics?: string;
  created_at: string;
}

export const setupDownloadHandlers = () => {
  const db = getDb();

  // 楽曲のダウンロードリクエストを処理
  ipcMain.handle("download-song", async (event, song: SongDownloadPayload) => {
    const songId = song.id;
    debugLog(`[IPC] download-song request for: ${song.title} (${songId})`);

    try {
      // 1. パスの準備
      const userDataPath = app.getPath("userData");
      const offlineDir = path.join(userDataPath, "offline_storage");
      const songsDir = path.join(offlineDir, "songs");
      const imagesDir = path.join(offlineDir, "images");

      // ディレクトリが存在することを確認
      await fs.promises.mkdir(songsDir, { recursive: true });
      await fs.promises.mkdir(imagesDir, { recursive: true });

      // URLから拡張子を取得、またはデフォルトを返すヘルパー
      const getExtension = (url: string, fallback: string) => {
        try {
          const urlObj = new URL(url);
          const ext = path.extname(urlObj.pathname);
          return ext || fallback;
        } catch (e) {
          const match = url.match(/\.([a-z0-9]+)(?:[\?#]|$)/i);
          return match ? `.${match[1]}` : fallback;
        }
      };

      // ローカル保存用のファイル名とパスを決定
      const songExt = getExtension(song.song_path, ".mp3");
      const imageExt = song.image_path
        ? getExtension(song.image_path, ".jpg")
        : ".jpg";

      const localSongFilename = `${songId}${songExt}`;
      const localImageFilename = `${songId}${imageExt}`;

      const localSongPath = path.join(songsDir, localSongFilename);
      const localImagePath = path.join(imagesDir, localImageFilename);

      // 2. ファイルをダウンロード
      // HTTP/HTTPS両方に対応し、リダイレクトも処理するヘルパー関数
      const downloadFile = (url: string, dest: string) => {
        return new Promise<void>((resolve, reject) => {
          const client = url.startsWith("https") ? https : http;
          const file = fs.createWriteStream(dest);

          const request = client.get(url, (response) => {
            // リダイレクトの処理 (301, 302)
            if (response.statusCode === 301 || response.statusCode === 302) {
              const redirectUrl = response.headers.location;
              if (redirectUrl) {
                file.close();
                downloadFile(redirectUrl, dest).then(resolve).catch(reject);
                return;
              }
            }

            if (response.statusCode !== 200) {
              fs.unlink(dest, () => {});
              reject(
                new Error(
                  `Download failed with status code: ${response.statusCode} for ${url}`
                )
              );
              return;
            }

            response.pipe(file);
            file.on("finish", () => {
              file.close(() => resolve());
            });
          });

          request.on("error", (err) => {
            fs.unlink(dest, () => {});
            reject(err);
          });

          // タイムアウト設定 (30秒)
          request.setTimeout(30000, () => {
            request.destroy();
            reject(new Error(`Download timeout for ${url}`));
          });
        });
      };

      // 並列でダウンロードを実行
      const downloadTasks = [];
      if (song.song_path) {
        downloadTasks.push(downloadFile(song.song_path, localSongPath));
      }

      let finalLocalImagePath: string | null = null;
      if (song.image_path) {
        downloadTasks.push(
          downloadFile(song.image_path, localImagePath).then(() => {
            finalLocalImagePath = `file://${localImagePath}`;
          })
        );
      }

      await Promise.all(downloadTasks);
      debugLog(`[IPC] Files downloaded for: ${songId}`);

      // 3. メタデータをSQLiteに保存 (Upsert)
      const songRecord = {
        id: song.id,
        userId: song.userId,
        title: song.title,
        author: song.author,

        // ローカルパス (独自のプロトコル形式)
        songPath: `file://${localSongPath}`,
        imagePath: finalLocalImagePath,

        // 元のリモートURL (再ダウンロードなどの参照用)
        originalSongPath: song.song_path,
        originalImagePath: song.image_path,

        duration: song.duration,
        genre: song.genre,
        lyrics: song.lyrics,

        createdAt: song.created_at,
        downloadedAt: new Date(),
      };

      await db.insert(songs).values(songRecord).onConflictDoUpdate({
        target: songs.id,
        set: songRecord,
      });

      debugLog(`[IPC] Database updated for: ${songId}`);

      return { success: true, localPath: songRecord.songPath };
    } catch (error: any) {
      debugLog(`[IPC] Download failed for ${songId}:`, error);
      return { success: false, error: error.message };
    }
  });

  // オフラインステータスの確認
  ipcMain.handle("check-offline-status", async (_, songId: string) => {
    try {
      const result = await db.query.songs.findFirst({
        where: eq(songs.id, songId),
        columns: {
          songPath: true,
        },
      });

      // レコードが存在し、かつローカルパスが設定されていればダウンロード済みとみなす
      const isDownloaded = !!(result && result.songPath);
      return {
        isDownloaded,
        localPath: result?.songPath || undefined,
      };
    } catch (error) {
      console.error("Failed to check offline status:", error);
      return { isDownloaded: false };
    }
  });

  // すべてのオフライン楽曲（ダウンロード済み）を取得
  ipcMain.handle("get-offline-songs", async () => {
    debugLog("[IPC] get-offline-songs request");

    try {
      // 実際にファイルがダウンロードされている楽曲のみを抽出
      const offlineSongs = await db.query.songs.findMany({
        where: isNotNull(songs.songPath),
      });

      debugLog(`[IPC] Found ${offlineSongs.length} offline songs`);

      // レンダラープロセスが期待する Song 型に変換して返す
      return offlineSongs.map((song) => ({
        id: song.id,
        user_id: song.userId,
        title: song.title,
        author: song.author,
        song_path: song.songPath,
        image_path: song.imagePath,
        original_song_path: song.originalSongPath,
        original_image_path: song.originalImagePath,
        duration: song.duration,
        genre: song.genre,
        lyrics: song.lyrics,
        created_at: song.createdAt,
        downloaded_at: song.downloadedAt,
      }));
    } catch (error: any) {
      console.error("[IPC] Failed to get offline songs:", error);
      return [];
    }
  });

  // オフライン楽曲の削除 (ファイルとDBレコードの両方を削除)
  ipcMain.handle("delete-offline-song", async (_, songId: string) => {
    debugLog(`[IPC] delete-offline-song request for: ${songId}`);

    try {
      // 1. ファイルパスを取得するためにレコードを確認
      const songRecord = await db.query.songs.findFirst({
        where: eq(songs.id, songId),
      });

      if (!songRecord) {
        debugLog(`[IPC] Song not found in DB: ${songId}`);
        return { success: false, error: "Song not found" };
      }

      // 2. ファイルを削除
      const filesToDelete: string[] = [];

      if (songRecord.songPath) {
        filesToDelete.push(toLocalPath(songRecord.songPath));
      }

      if (songRecord.imagePath) {
        filesToDelete.push(toLocalPath(songRecord.imagePath));
      }

      // 実際のファイルを削除 (存在しない場合はスキップ)
      for (const filePath of filesToDelete) {
        try {
          if (fs.existsSync(filePath)) {
            await fs.promises.unlink(filePath);
            debugLog(`[IPC] Deleted file: ${filePath}`);
          }
        } catch (err: any) {
          if (err.code !== "ENOENT") {
            debugLog(`[IPC] Warning: Could not delete file: ${filePath}`, err);
          }
        }
      }

      // 3. データベースからレコードを削除
      await db.delete(songs).where(eq(songs.id, songId));
      debugLog(`[IPC] Deleted song from DB: ${songId}`);

      return { success: true };
    } catch (error: any) {
      console.error(`[IPC] Failed to delete offline song ${songId}:`, error);
      return { success: false, error: error.message };
    }
  });
};
