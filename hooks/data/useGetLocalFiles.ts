import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { CHANNELS } from "@/electron/channels";
import { CACHED_QUERIES } from "@/constants";
import { LocalFile, FileMetadata } from "@/types/local";

/**
 * スキャン情報の型
 */
export interface ScanInfo {
  newFiles: string[];
  modifiedFiles: string[];
  unchangedFiles: string[];
  deletedFiles: string[];
  isSameDirectory: boolean;
  isFullScan: boolean;
}

/**
 * スキャン進捗の型（Electron側と同期）
 */
export interface ScanProgress {
  phase: "scanning" | "analyzing" | "metadata" | "complete";
  current: number;
  total: number;
  currentFile?: string;
  message: string;
}

/**
 * スキャン結果に含まれるファイル情報
 */
interface FileWithMetadataInfo {
  path: string;
  metadata: FileMetadata | null;
  lastModified?: number | null;
  needsMetadata: boolean;
}

/**
 * スキャン結果の型（キャッシュ済みメタデータを含む）
 */
interface ScanResult {
  files?: string[];
  filesWithMetadata?: FileWithMetadataInfo[];
  scanInfo?: ScanInfo;
  error?: string;
}

/**
 * キャッシュ結果の型
 */
interface CachedFilesResult {
  exists: boolean;
  directoryPath?: string;
  files: { path: string; metadata: FileMetadata | null; lastModified?: number | null }[];
  lastScan?: string;
  error?: string;
}

/**
 * メタデータ取得結果の型
 */
interface MetadataResult {
  metadata?: FileMetadata;
  fromCache?: boolean;
  error?: string;
}

/**
 * フックの戻り値データ型
 */
interface LocalFilesData {
  files: LocalFile[];
  scanInfo: ScanInfo | null;
  fromCache: boolean; // キャッシュから読み込んだかどうか
}

/**
 * バッチ処理でメタデータを取得（メタデータが不足しているファイルのみ）
 * 一度に処理するファイル数を制限してCPU負荷を軽減
 */
const BATCH_SIZE = 10;

interface MetadataWithArt {
  metadata: FileMetadata;
  error?: string;
}

async function fetchMissingMetadataInBatches(
  filesNeedingMetadata: string[]
): Promise<Map<string, MetadataWithArt>> {
  const metadataMap = new Map<string, MetadataWithArt>();

  if (filesNeedingMetadata.length === 0) {
    return metadataMap;
  }

  for (let i = 0; i < filesNeedingMetadata.length; i += BATCH_SIZE) {
    const batch = filesNeedingMetadata.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(async (filePath: string) => {
        try {
          const result: MetadataResult =
            await window.electron.ipc.invoke(CHANNELS.GET_MP3_METADATA, filePath);
          return {
            path: filePath,
            metadata: result.metadata,
            error: result.error,
          };
        } catch (err: unknown) {
          return { path: filePath, metadata: null, error: err instanceof Error ? err.message : "Unknown error" };
        }
      })
    );
    batchResults.forEach(({ path, metadata }) => {
      if (metadata) {
        metadataMap.set(path, { metadata });
      }
    });
  }

  return metadataMap;
}

/**
 * ローカルMP3ファイルを取得するカスタムフック
 *
 * TanStack Queryを使用してキャッシュ管理を行い、
 * ディレクトリのスキャンとメタデータ取得を効率的に処理する
 *
 * 最適化ポイント:
 * - 初回ロード時はElectronのキャッシュから即座に読み込み（スキャンなし）
 * - 再スキャンボタン押下時のみ実際のスキャンを実行
 * - メタデータが不足しているファイルのみ個別取得
 *
 * @param directoryPath スキャン対象のディレクトリパス
 * @returns ファイルリストとスキャン情報
 */
const useGetLocalFiles = (directoryPath: string | null) => {
  const queryClient = useQueryClient();

  // 強制スキャンフラグ（クエリキーに含めず、refで管理）
  const forceScanRef = useRef(false);

  // スキャン進捗状態
  const [scanProgress, setScanProgress] = useState<ScanProgress | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Electron IPC からの進捗イベントをリッスン
  // queryClient を ref で保持して、無限ループを防ぐ
  const queryClientRef = useRef(queryClient);
  queryClientRef.current = queryClient;

  // スキャン完了済みフラグ（重複無効化を防ぐ）
  const scanCompletedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.electron?.ipc?.on) {
      return;
    }

    const unsubscribe = window.electron.ipc.on(
      CHANNELS.SCAN_PROGRESS,
      (progress: ScanProgress) => {
        setScanProgress(progress);

        // 既存のタイムアウトをクリア
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        // スキャン開始時にフラグをリセット
        if (progress.phase === "scanning") {
          scanCompletedRef.current = false;
        }

        // スキャン完了時（一度だけ実行）
        if (progress.phase === "complete" && !scanCompletedRef.current) {
          scanCompletedRef.current = true;

          // savedLibraryInfo のキャッシュを無効化（スキャン結果を反映）
          queryClientRef.current.invalidateQueries({
            queryKey: [CACHED_QUERIES.savedLibraryInfo],
          });

          // 少し待ってから進捗をクリア
          timeoutRef.current = setTimeout(() => {
            setScanProgress(null);
            timeoutRef.current = null;
          }, 2000);
        }
      }
    );

    return () => {
      // クリーンアップ：リスナーとタイムアウトを解除
      if (unsubscribe) {
        unsubscribe();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []); // 依存配列を空に

  // クエリキーはディレクトリパスのみ
  const queryKey = [CACHED_QUERIES.localFiles, directoryPath];

  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: async (): Promise<LocalFilesData> => {
      if (!directoryPath) {
        return { files: [], scanInfo: null, fromCache: false };
      }

      // フルスキャンが要求されているかチェック
      const shouldForceScan = forceScanRef.current;
      forceScanRef.current = false;

      // スキャンが要求されていない場合、まずキャッシュから読み込む
      if (!shouldForceScan) {
        try {
          const cachedResult: CachedFilesResult =
            await window.electron.ipc.invoke(
              CHANNELS.GET_CACHED_FILES_WITH_METADATA
            );

          // キャッシュが存在し、同じディレクトリの場合はキャッシュを使用
          if (
            cachedResult.exists &&
            cachedResult.directoryPath === directoryPath &&
            cachedResult.files.length > 0
          ) {
            const filesWithMetadata: LocalFile[] = cachedResult.files.map(
              (f) => ({
                path: f.path,
                metadata: f.metadata || undefined,
                lastModified: f.lastModified || undefined,
              })
            );

            return {
              files: filesWithMetadata,
              scanInfo: null, // キャッシュからの読み込みなのでスキャン情報なし
              fromCache: true,
            };
          }
        } catch (e) {
          // キャッシュ読み込み失敗時はスキャンにフォールバック
          console.warn("キャッシュ読み込みに失敗、スキャンを実行します:", e);
        }
      }

      // キャッシュがない、または再スキャンが要求された場合はスキャン実行
      const scanResult: ScanResult = await window.electron.ipc.invoke(
        CHANNELS.SCAN_MP3_FILES,
        directoryPath,
        shouldForceScan
      );

      if (scanResult.error) {
        throw new Error(scanResult.error);
      }

      const filesWithMetadataInfo = scanResult.filesWithMetadata || [];

      // メタデータが不足しているファイルを抽出
      const filesNeedingMetadata = filesWithMetadataInfo
        .filter((f) => f.needsMetadata)
        .map((f) => f.path);

      // 不足分のメタデータをバッチ取得
      const fetchedMetadata = await fetchMissingMetadataInBatches(
        filesNeedingMetadata
      );

      // 最終的なファイルリストを構築
      const filesWithMetadata: LocalFile[] = filesWithMetadataInfo.map(
        (fileInfo) => {
          if (fileInfo.metadata) {
            return {
              path: fileInfo.path,
              metadata: fileInfo.metadata,
              lastModified: fileInfo.lastModified || undefined,
            };
          } else if (fetchedMetadata.has(fileInfo.path)) {
            const fetched = fetchedMetadata.get(fileInfo.path)!;
            return {
              path: fileInfo.path,
              metadata: fetched.metadata,
              lastModified: fileInfo.lastModified || undefined,
            };
          } else {
            return {
              path: fileInfo.path,
              error: "メタデータを取得できませんでした",
              lastModified: fileInfo.lastModified || undefined,
            };
          }
        }
      );

      return {
        files: filesWithMetadata,
        scanInfo: scanResult.scanInfo || null,
        fromCache: false,
      };
    },
    // ローカルファイルは重いスキャン処理のため、ユーザーが明示的に再スキャンするまでキャッシュを永続化
    staleTime: Infinity,
    gcTime: Infinity,
    enabled: !!directoryPath,
  });

  /**
   * 強制的に再スキャンを実行
   */
  const forceRescan = useCallback(async () => {
    // スキャンフラグをセット
    forceScanRef.current = true;
    // localFiles のキャッシュを無効化して再スキャン
    // savedLibraryInfo はスキャン完了時のイベントで無効化される
    await queryClient.invalidateQueries({
      queryKey: [CACHED_QUERIES.localFiles, directoryPath],
    });
  }, [queryClient, directoryPath]);

  return {
    files: data?.files ?? [],
    isLoading,
    error,
    scanInfo: data?.scanInfo ?? null,
    scanProgress,
    fromCache: data?.fromCache ?? false,
    refetch,
    forceRescan,
  };
};

export default useGetLocalFiles;
