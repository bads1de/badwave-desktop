import { useQuery } from "@tanstack/react-query";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";

/**
 * Supabase Storageからファイルをダウンロードするためのカスタムフック
 *
 * @param {string} path - ダウンロードするファイルのパス
 * @returns {Object} ダウンロード状態と結果を含むオブジェクト
 * @property {string|null} fileUrl - ダウンロードしたファイルのURL
 * @property {boolean} isLoading - ダウンロード中の状態
 * @property {Error|null} error - エラーオブジェクト
 *
 */
const useDownload = (path: string) => {
  const {
    data: fileUrl,
    isLoading,
    error,
  } = useQuery({
    queryKey: [CACHED_QUERIES.downloadFile, path],
    queryFn: async () => {
      if (!path) {
        return null;
      }

      if (path.startsWith("http://") || path.startsWith("https://")) {
        return path;
      }
    },
    enabled: !!path,
    staleTime: CACHE_CONFIG.staleTime,
    gcTime: CACHE_CONFIG.gcTime,
  });

  return { fileUrl, isLoading, error };
};

export default useDownload;
