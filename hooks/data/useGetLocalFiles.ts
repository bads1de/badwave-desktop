import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { CACHED_QUERIES } from "@/constants";
import { LocalFile } from "@/app/local/page";

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
 * スキャン結果の型
 */
interface ScanResult {
  files?: string[];
  scanInfo?: ScanInfo;
  error?: string;
}

/**
 * メタデータ取得結果の型
 */
interface MetadataResult {
  metadata?: any;
  fromCache?: boolean;
  error?: string;
}

/**
 * フックの戻り値データ型
 */
interface LocalFilesData {
  files: LocalFile[];
  scanInfo: ScanInfo | null;
}

/**
 * ローカルMP3ファイルを取得するカスタムフック
 *
 * TanStack Queryを使用してキャッシュ管理を行い、
 * ディレクトリのスキャンとメタデータ取得を効率的に処理する
 *
 * @param directoryPath スキャン対象のディレクトリパス
 * @param forceFullScan 強制的に完全スキャンを行うかどうか
 * @returns ファイルリストとスキャン情報
 */
const useGetLocalFiles = (
  directoryPath: string | null,
  forceFullScan: boolean = false
) => {
  const queryClient = useQueryClient();

  const queryKey = [CACHED_QUERIES.localFiles, directoryPath, forceFullScan];

  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: async (): Promise<LocalFilesData> => {
      if (!directoryPath) {
        return { files: [], scanInfo: null };
      }

      // ディレクトリをスキャン
      const scanResult: ScanResult = await window.electron.ipc.invoke(
        "handle-scan-mp3-files",
        directoryPath,
        forceFullScan
      );

      if (scanResult.error) {
        throw new Error(scanResult.error);
      }

      const filePaths = scanResult.files || [];

      // 各ファイルのメタデータを取得
      const filesWithMetadata = await Promise.all(
        filePaths.map(async (path: string): Promise<LocalFile> => {
          try {
            const metadataResult: MetadataResult =
              await window.electron.ipc.invoke("handle-get-mp3-metadata", path);

            if (metadataResult.error) {
              return { path, error: metadataResult.error };
            }

            return { path, metadata: metadataResult.metadata };
          } catch (err: any) {
            return { path, error: err.message };
          }
        })
      );

      return {
        files: filesWithMetadata,
        scanInfo: scanResult.scanInfo || null,
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
    // キャッシュを無効化して再取得
    await queryClient.invalidateQueries({
      queryKey: [CACHED_QUERIES.localFiles, directoryPath],
    });
    refetch();
  }, [queryClient, directoryPath, refetch]);

  return {
    files: data?.files ?? [],
    isLoading,
    error,
    scanInfo: data?.scanInfo ?? null,
    refetch,
    forceRescan,
  };
};

export default useGetLocalFiles;
