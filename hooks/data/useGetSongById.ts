import { Song } from "@/types";
import { createClient } from "@/libs/supabase/client";
import { electronAPI } from "@/libs/electron-utils";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";
import { useEffect, useState } from "react";

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
    queryFn: async (): Promise<Song | null> => {
      if (!normalizedId) {
        return null;
      }

      // ローカル曲のIDの場合は処理をスキップ
      if (normalizedId.startsWith("local_")) {
        return null;
      }

      const { data, error } = await supabaseClient
        .from("songs")
        .select("*")
        .eq("id", normalizedId)
        .maybeSingle();

      if (error) {
        throw new Error(`Failed to load song: ${error.message}`);
      }

      return data as Song | null;
    },
    staleTime: CACHE_CONFIG.staleTime,
    gcTime: CACHE_CONFIG.gcTime,
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
        const { isDownloaded, localPath } =
          await electronAPI.offline.checkStatus(song.id);

        if (isDownloaded && localPath) {
          if (isMounted) {
            setFinalSong({
              ...song,
              song_path: localPath,
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

  // エラーハンドリング（オフライン時を除く）
  if (error && !isPaused) {
    toast.error(error.message);
  }

  return { isLoading, song: finalSong, isPaused };
};

export default useGetSongById;
