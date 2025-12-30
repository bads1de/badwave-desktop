import { Song } from "@/types";
import { createClient } from "@/libs/supabase/client";
import { electronAPI, isNetworkError } from "@/libs/electron-utils";
import {
  useQuery,
  keepPreviousData,
  onlineManager,
} from "@tanstack/react-query";
import toast from "react-hot-toast";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";
import { useEffect, useState, useRef } from "react";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";

/**
 * 指定されたIDに基づいて曲を取得するカスタムフック
 *
 * onlineManager により、オフライン時はクエリが自動的に pause されます。
 * PersistQueryClient により、オフライン時や起動時は即座にキャッシュから表示されます。
 *
 * @param {string|number|undefined} id - 取得する曲のID
 * @returns {Object} 曲の取得状態と結果
 */
const useGetSongById = (id?: string | number) => {
  const supabaseClient = createClient();
  const { isOnline } = useNetworkStatus();

  // IDを文字列に正規化
  const normalizedId = id != null ? String(id) : undefined;

  const queryKey = [CACHED_QUERIES.songById, normalizedId];

  const {
    isLoading,
    data: song,
    error,
    fetchStatus,
  } = useQuery({
    queryKey,
    queryFn: async (): Promise<Song | null | undefined> => {
      if (!normalizedId) {
        return null;
      }

      // ローカル曲のIDの場合は処理をスキップ
      if (normalizedId.startsWith("local_")) {
        return null;
      }

      // オフライン時はフェッチをスキップ
      if (!onlineManager.isOnline()) {
        return undefined;
      }

      const { data, error } = await supabaseClient
        .from("songs")
        .select("*")
        .eq("id", normalizedId)
        .maybeSingle();

      if (error) {
        if (!onlineManager.isOnline() || isNetworkError(error)) {
          console.log("[useGetSongById] Fetch skipped: offline/network error");
          return undefined;
        }
        throw new Error(`Failed to load song: ${error.message}`);
      }

      return data as Song | null;
    },
    staleTime: CACHE_CONFIG.staleTime,
    gcTime: CACHE_CONFIG.gcTime,
    // IDが有効でローカル曲でない場合に有効化
    // オフライン時もクエリは有効だが、networkMode: offlineFirst により
    // キャッシュがあればそれを使い、なければ pause される
    enabled: !!normalizedId && !normalizedId.startsWith("local_"),
    placeholderData: keepPreviousData,
    retry: false,
  });

  // ローカルファイルの確認とパスの差し替え
  const [finalSong, setFinalSong] = useState<Song | null | undefined>(song);

  useEffect(() => {
    let isMounted = true;

    const checkLocalFile = async () => {
      if (!song || !electronAPI.isElectron()) {
        if (isMounted) setFinalSong(song ?? undefined);
        return;
      }

      try {
        const { isDownloaded, localPath, localImagePath } =
          await electronAPI.offline.checkStatus(song.id);

        if (isDownloaded && localPath) {
          if (isMounted) {
            setFinalSong({
              ...song,
              song_path: localPath,
              is_downloaded: true,
              local_song_path: localPath,
              local_image_path: localImagePath,
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

  const isPaused = fetchStatus === "paused";

  // エラー表示用のref（重複表示を防ぐ）
  const errorShownRef = useRef<string | null>(null);

  // エラーハンドリング（オフライン時を除く）- useEffect内で実行
  useEffect(() => {
    // オフライン時はエラーを表示しない
    if (!isOnline) return;

    if (error && !isPaused && errorShownRef.current !== error.message) {
      errorShownRef.current = error.message;
      toast.error(error.message);
    }
    // エラーがクリアされたらrefもリセット
    if (!error) {
      errorShownRef.current = null;
    }
  }, [error, isPaused, isOnline]);

  return { isLoading, song: finalSong, isPaused };
};

export default useGetSongById;
