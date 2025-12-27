import { ipcMain } from "electron";
import * as fs from "fs";
import * as path from "path";
import * as mm from "music-metadata";
import store from "../lib/store";
import { debugLog } from "../utils";

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

export function setupLibraryHandlers() {
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
}
