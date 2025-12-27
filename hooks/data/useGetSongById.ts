import { Song } from "@/types";
import { createClient } from "@/libs/supabase/client";
import { electronAPI } from "@/libs/electron-utils";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";
import { useOfflineCache } from "@/hooks/utils/useOfflineCache";
import { useEffect, useState } from "react";

/**
 * 指定されたIDに基づいて曲を取得するカスタムフック
 *
 * @param {string|number|undefined} id - 取得する曲のID
 * @returns {Object} 曲の取得状態と結果
 */
const useGetSongById = (id?: string | number) => {
  const supabaseClient = createClient();
  const { isOnline } = useNetworkStatus();
  const { saveToCache, loadFromCache } = useOfflineCache();

  // IDを文字列に正規化
  const normalizedId = id != null ? String(id) : undefined;

  const queryKey = [CACHED_QUERIES.songById, normalizedId];

  const {
    isLoading,
    data: song,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!normalizedId) {
        return undefined;
      }

      // ローカル曲のIDの場合は処理をスキップ
      if (normalizedId.startsWith("local_")) {
        return undefined;
      }

      // オフラインの場合はキャッシュから取得を試みる
      if (!isOnline) {
        const cachedData = await loadFromCache<Song>(queryKey.join(":"));
        if (cachedData) return cachedData;
        return undefined;
      }

      const { data, error } = await supabaseClient
        .from("songs")
        .select("*")
        .eq("id", normalizedId)
        .maybeSingle();

      if (error) {
        throw new Error(`Failed to load song: ${error.message}`);
      }

      const result = data as Song;

      // バックグラウンドでキャッシュに保存
      if (result) {
        saveToCache(queryKey.join(":"), result).catch(console.error);
      }

      return result;
    },
    staleTime: CACHE_CONFIG.staleTime,
    gcTime: CACHE_CONFIG.gcTime,
    enabled: !!normalizedId && !normalizedId.startsWith("local_"), // ローカル曲の場合は無効化
    placeholderData: keepPreviousData,
    retry: isOnline ? 1 : false,
  });

  // オンラインに戻ったときに再取得
  useEffect(() => {
    if (isOnline && normalizedId && !normalizedId.startsWith("local_")) {
      refetch();
    }
  }, [isOnline, normalizedId, refetch]);

  // ローカルファイルの確認とパスの差し替え
  const [finalSong, setFinalSong] = useState<Song | undefined>(song);

  useEffect(() => {
    let isMounted = true;

    const checkLocalFile = async () => {
      if (!song || !electronAPI.isElectron()) {
        if (isMounted) setFinalSong(song);
        return;
      }

      try {
        const { getDownloadFilename, toFileUrl } = await import(
          "@/libs/songUtils"
        );
        const filename = getDownloadFilename(song);
        const exists = await electronAPI.downloader.checkFileExists(filename);

        if (exists) {
          const localPath = await electronAPI.downloader.getLocalFilePath(
            filename
          );
          // file:// プロトコルに変換
          const fileUrl = toFileUrl(localPath);

          if (isMounted) {
            setFinalSong({
              ...song,
              song_path: fileUrl,
            });
          }
        } else {
          if (isMounted) setFinalSong(song);
        }
      } catch (e) {
        console.error("Failed to check local file:", e);
        if (isMounted) setFinalSong(song);
      }
    };

    checkLocalFile();

    return () => {
      isMounted = false;
    };
  }, [song]);

  // useQuery の外でエラーハンドリングを行う
  if (error && isOnline) {
    toast.error(error.message);
  }

  return { isLoading, song: finalSong };
};

export default useGetSongById;
