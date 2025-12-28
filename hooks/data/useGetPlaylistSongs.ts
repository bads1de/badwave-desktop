import { Song } from "@/types";
import { createClient } from "@/libs/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";
import { useOfflineCheck } from "@/hooks/utils/useOfflineCheck";
import { electronAPI } from "@/libs/electron-utils";
import { useEffect } from "react";

/**
 * プレイリストの曲を取得するカスタムフック
 *
 * オフライン対応 (SQLiteキャッシュ使用)
 */
const useGetPlaylistSongs = (playlistId?: string) => {
  const supabaseClient = createClient();
  const { isOnline } = useNetworkStatus();
  const { checkOffline } = useOfflineCheck();

  const queryKey = [CACHED_QUERIES.playlists, playlistId, "songs"];

  const {
    data: songs = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!playlistId) return [];

      // 直接オフライン状態を確認（クロージャのタイミング問題を回避）
      const isCurrentlyOffline = await checkOffline();

      // オフラインの場合は SQLite キャッシュから取得
      if (isCurrentlyOffline) {
        try {
          const cachedData = await electronAPI.cache.getCachedPlaylistSongs(
            playlistId
          );
          if (cachedData && cachedData.length > 0) {
            return cachedData as Song[];
          }
        } catch (e) {
          console.error("Failed to load playlist songs from SQLite cache:", e);
        }
        return [];
      }

      // オンラインの場合は Supabase から取得
      const { data, error } = await supabaseClient
        .from("playlist_songs")
        .select("*, songs(*)")
        .eq("playlist_id", playlistId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching playlist songs:", error);
        throw new Error("プレイリストの曲の取得に失敗しました");
      }

      if (!data) return [];

      const mappedSongs = data.map((item) => ({
        ...item.songs,
        songType: "regular" as const,
      })) as Song[];

      // キャッシュ同期（バックグラウンド）
      if (electronAPI.isElectron()) {
        electronAPI.cache
          .syncPlaylistSongs(playlistId, mappedSongs)
          .catch((e) => {
            console.error("Failed to sync playlist songs with metadata:", e);
          });
      }

      return mappedSongs;
    },
    staleTime: CACHE_CONFIG.staleTime,
    gcTime: CACHE_CONFIG.gcTime,
    enabled: !!playlistId,
    retry: isOnline ? 1 : false,
  });

  useEffect(() => {
    if (isOnline && playlistId) {
      refetch();
    }
  }, [isOnline, playlistId, refetch]);

  return { songs, isLoading, error };
};

export default useGetPlaylistSongs;
