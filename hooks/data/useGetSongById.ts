import { Song } from "@/types";
import { createClient } from "@/libs/supabase/client";
import { electronAPI } from "@/libs/electron-utils";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";
import { useOfflineCache } from "@/hooks/utils/useOfflineCache";
import { useEffect, useState, useRef } from "react";

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
    queryFn: async (): Promise<Song | null> => {
      if (!normalizedId) {
        return null;
      }

      // ローカル曲のIDの場合は処理をスキップ
      if (normalizedId.startsWith("local_")) {
        return null;
      }

      // オフラインの場合
      if (!isOnline) {
        // まずキャッシュから取得を試みる
        const cachedData = await loadFromCache<Song>(queryKey.join(":"));
        if (cachedData) return cachedData;

        // ElectronAPIからダウンロード済み曲を取得
        if (electronAPI.isElectron()) {
          try {
            const offlineSongs = await electronAPI.offline.getSongs();
            const offlineSong = offlineSongs.find(
              (s) => String(s.id) === normalizedId
            );
            if (offlineSong) {
              // OfflineSong を Song 型にキャスト
              return offlineSong as unknown as Song;
            }
          } catch (e) {
            console.error("Failed to get offline song:", e);
          }
        }

        // オフラインでデータが見つからない場合はnullを返す
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

      const result = data as Song | null;

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

  const prevIsOnline = useRef(isOnline);

  // オンラインに戻ったときに再取得
  useEffect(() => {
    if (
      !prevIsOnline.current &&
      isOnline &&
      normalizedId &&
      !normalizedId.startsWith("local_")
    ) {
      refetch();
    }
    prevIsOnline.current = isOnline;
  }, [isOnline, normalizedId, refetch]);

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
          // file:// プロトコルに変換 (localPathが既にfile://を含んでいる場合もあるが念のため確認)
          // DBには file:// 付きで保存されているはずだが、念のため songUtils の toFileUrl は使わず
          // そのまま使うか、必要なら処理する。
          // IPC側実装: songPath: `file://${localSongPath}` となっている。
          // したがってそのまま使える。

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

  // useQuery の外でエラーハンドリングを行う
  if (error && isOnline) {
    toast.error(error.message);
  }

  return { isLoading, song: finalSong };
};

export default useGetSongById;
