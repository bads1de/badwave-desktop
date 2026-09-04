import { CHANNELS } from "../channels";
import { ipcMain, app } from "electron";
import * as fs from "fs";
import * as path from "path";
import * as mm from "music-metadata";
import store from "../lib/store";
import { debugLog } from "../utils";
import { getMainWindow } from "../lib/window-manager";
import { validateInput, filePathSchema } from "../lib/ipc-validate";
import { MusicLibrary, FileMetadata } from "../../types/local";
import { getErrorMessage } from "../lib/error";

// サポートされている音声ファイルの拡張子
// 注: electron tsconfig の rootDir 制約により、constants/ からインポートできないため直接定義
const SUPPORTED_AUDIO_EXTENSIONS = [
  ".mp3", ".wav", ".flac", ".aac", ".ogg", ".opus",
  ".m4a", ".wma", ".alac", ".aiff", ".webm",
];

function isSupportedAudioFile(fileName: string): boolean {
  const ext = path.extname(fileName).toLowerCase();
  return SUPPORTED_AUDIO_EXTENSIONS.includes(ext);
}

// 音楽ライブラリのデータを保存するためのストアキー
const MUSIC_LIBRARY_KEY = "music_library";
const MUSIC_LIBRARY_LAST_SCAN_KEY = "music_library_last_scan";

/**
 * スキャン進捗の型定義
 */
export interface ScanProgress {
  phase: "scanning" | "analyzing" | "metadata" | "complete";
  current: number;
  total: number;
  currentFile?: string;
  message: string;
}

/**
 * スキャン進捗をフロントエンドに送信するヘルパー関数
 */
function sendScanProgress(progress: ScanProgress) {
  const mainWindow = getMainWindow();
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(CHANNELS.SCAN_PROGRESS, progress);
  }
}

export function setupLibraryHandlers() {
  // 指定されたフォルダ内のMP3ファイルをスキャン（永続化対応版）
  ipcMain.handle(
    CHANNELS.SCAN_MP3_FILES,
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

        // 進捗: スキャン開始
        sendScanProgress({
          phase: "scanning",
          current: 0,
          total: 0,
          message: "ファイルを検索中...",
        });

        // 現在のライブラリ情報を初期化
        const currentLibrary: MusicLibrary = {
          directoryPath,
          files: {},
        };

        // ディレクトリ内のファイルを再帰的に取得する関数（シンボリックリンクループ保護付き）
        const scanDirectory = async (dir: string, visited = new Set<string>()): Promise<string[]> => {
          const realDir = await fs.promises.realpath(dir);
          if (visited.has(realDir)) {
            return [];
          }
          visited.add(realDir);

          const entries = await fs.promises.readdir(dir, {
            withFileTypes: true,
          });
          const files: string[] = [];

          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
              // サブディレクトリを再帰的にスキャン
              const subFiles = await scanDirectory(fullPath, visited);
              files.push(...subFiles);
            } else if (entry.isFile() && isSupportedAudioFile(entry.name)) {
              // サポートされている音声ファイルを追加
              files.push(fullPath);
            }
          }

          return files;
        };

        // ディレクトリ内のすべてのMP3ファイルを取得
        const allFiles = await scanDirectory(directoryPath);

        // 進捗: ファイル検索完了、分類開始
        sendScanProgress({
          phase: "analyzing",
          current: 0,
          total: allFiles.length,
          message: `${allFiles.length}個のファイルを分析中...`,
        });

        // 新しいファイル、変更されたファイル、変更なしのファイルを分類
        const newFiles: string[] = [];
        const modifiedFiles: string[] = [];
        const unchangedFiles: string[] = [];

        for (let i = 0; i < allFiles.length; i++) {
          const filePath = allFiles[i];
          const stats = await fs.promises.stat(filePath);
          const lastModified = stats.mtimeMs;

          // 100ファイルごとに進捗を更新（パフォーマンス考慮）
          if (i % 100 === 0 || i === allFiles.length - 1) {
            sendScanProgress({
              phase: "analyzing",
              current: i + 1,
              total: allFiles.length,
              currentFile: path.basename(filePath),
              message: `ファイルを分析中... (${i + 1}/${allFiles.length})`,
            });
          }

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
          const allFilesSet = new Set(allFiles); // O(1)検索のためSetを使用
          for (const filePath in savedLibrary.files) {
            if (!allFilesSet.has(filePath)) {
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

        // 進捗: スキャン完了
        sendScanProgress({
          phase: "complete",
          current: allFiles.length,
          total: allFiles.length,
          message: `スキャン完了: ${allFiles.length}ファイルを処理しました`,
        });

        // スキャン結果を返す
        // キャッシュ済みメタデータも一緒に返す（フロントエンドでの個別IPC呼び出しを削減）
        const filesWithMetadata = allFiles.map((filePath) => {
          const fileInfo = currentLibrary.files[filePath];
          return {
            path: filePath,
            metadata: fileInfo?.metadata || null,
            lastModified: fileInfo?.lastModified ?? null,
            needsMetadata: !fileInfo?.metadata, // メタデータ取得が必要かどうか
          };
        });

        return {
          files: allFiles,
          filesWithMetadata,
          scanInfo: {
            newFiles,
            modifiedFiles,
            unchangedFiles,
            deletedFiles,
            isSameDirectory,
            isFullScan: !shouldPerformDiffScan,
          },
        };
      } catch (error: unknown) {
        debugLog(
          `[Error] MP3ファイルのスキャンに失敗: ${directoryPath}`,
          error
        );
        return { error: getErrorMessage(error) };
      }
    }
  );

  // 保存されている音楽ライブラリデータを取得
  ipcMain.handle(CHANNELS.GET_SAVED_MUSIC_LIBRARY, async () => {
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
    } catch (error: unknown) {
      debugLog(`[Error] 保存された音楽ライブラリの取得に失敗:`, error);
      return { error: getErrorMessage(error) };
    }
  });

  // キャッシュ済みのファイルリスト+メタデータを取得（スキャンなし）
  // ページ遷移時の高速ロード用
  ipcMain.handle(CHANNELS.GET_CACHED_FILES_WITH_METADATA, async () => {
    try {
      const savedLibrary = store.get(MUSIC_LIBRARY_KEY) as
        | MusicLibrary
        | undefined;
      const lastScan = store.get(MUSIC_LIBRARY_LAST_SCAN_KEY) as
        | string
        | undefined;

      if (!savedLibrary || Object.keys(savedLibrary.files).length === 0) {
        return { exists: false, files: [] };
      }

      // キャッシュ済みのファイルリスト+メタデータを構築
      const filesWithMetadata = Object.entries(savedLibrary.files).map(
        ([filePath, fileInfo]) => ({
          path: filePath,
          metadata: fileInfo.metadata || null,
          lastModified: fileInfo.lastModified ?? null,
        })
      );

      return {
        exists: true,
        directoryPath: savedLibrary.directoryPath,
        files: filesWithMetadata,
        lastScan,
      };
    } catch (error: unknown) {
      debugLog(`[Error] キャッシュ済みファイルの取得に失敗:`, error);
      return { error: getErrorMessage(error), exists: false, files: [] };
    }
  });

  // MP3ファイルのメタデータを取得
  // 注意: このハンドラーは個別のファイルに対して呼ばれるため、
  // ストアへの書き込みは遅延させてバッチ処理する
  let pendingMetadataUpdates: Map<
    string,
    { metadata: FileMetadata; lastModified: number }
  > = new Map();
  let saveTimeout: NodeJS.Timeout | null = null;

  const debouncedSaveLibrary = () => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    saveTimeout = setTimeout(() => {
      if (pendingMetadataUpdates.size > 0) {
        const savedLibrary = store.get(MUSIC_LIBRARY_KEY) as
          | MusicLibrary
          | undefined;
        if (savedLibrary) {
          pendingMetadataUpdates.forEach((update, filePath) => {
            if (!savedLibrary.files[filePath]) {
              savedLibrary.files[filePath] = {
                lastModified: update.lastModified,
              };
            }
            savedLibrary.files[filePath].metadata = update.metadata;
            savedLibrary.files[filePath].lastModified = update.lastModified;
            delete savedLibrary.files[filePath].error;
          });
          store.set(MUSIC_LIBRARY_KEY, savedLibrary);
          debugLog(
            `[Store] メタデータを保存: ${pendingMetadataUpdates.size}件`
          );
        }
        pendingMetadataUpdates.clear();
      }
      saveTimeout = null;
    }, 1000); // 1秒間の遅延でバッチ保存
  };

  ipcMain.handle(CHANNELS.GET_MP3_METADATA, async (_, rawFilePath: string) => {
    // パストラバーサル対策: 絶対パスのみ許可、長さ制限
    const filePath = validateInput(
      filePathSchema,
      rawFilePath,
      CHANNELS.GET_MP3_METADATA,
    );

    // 拡張子チェック: サポートされている音声ファイルのみ
    if (!isSupportedAudioFile(filePath)) {
      return { error: "Unsupported file extension" };
    }

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

      // ペンディングキューに追加（即座に保存しない）
      pendingMetadataUpdates.set(filePath, { metadata: metadata as unknown as FileMetadata, lastModified });

      // 遅延保存をスケジュール
      debouncedSaveLibrary();

      return { metadata: metadata as unknown as FileMetadata, fromCache: false };
    } catch (error: unknown) {
      debugLog(`[Error] メタデータの取得に失敗: ${filePath}`, error);
      const message = getErrorMessage(error);

      // エラー情報をライブラリデータに保存
      const savedLibrary = store.get(MUSIC_LIBRARY_KEY) as
        | MusicLibrary
        | undefined;
      if (savedLibrary && savedLibrary.files[filePath]) {
        savedLibrary.files[filePath].error = message;
        store.set(MUSIC_LIBRARY_KEY, savedLibrary);
      }

      return { error: message };
    }
  });
}
