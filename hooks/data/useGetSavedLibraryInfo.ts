import { useQuery } from "@tanstack/react-query";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";

/**
 * 保存されたライブラリ情報の型
 */
export interface SavedLibraryInfo {
  exists: boolean;
  directoryPath?: string;
  fileCount?: number;
  lastScan?: string;
  directoryExists?: boolean;
  error?: string;
}

/**
 * 保存されたミュージックライブラリ情報を取得するカスタムフック
 *
 * TanStack Queryを使用してキャッシュ管理を行う
 *
 * @returns ライブラリ情報の取得状態と結果
 */
const useGetSavedLibraryInfo = () => {
  const queryKey = [CACHED_QUERIES.savedLibraryInfo];

  const {
    data: libraryInfo,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const result = await window.electron.ipc.invoke(
        "handle-get-saved-music-library"
      );

      if (result.error) {
        throw new Error(result.error);
      }

      return result as SavedLibraryInfo;
    },
    staleTime: CACHE_CONFIG.staleTime,
    gcTime: CACHE_CONFIG.gcTime,
  });

  return {
    libraryInfo,
    isLoading,
    error,
    refetch,
  };
};

export default useGetSavedLibraryInfo;
