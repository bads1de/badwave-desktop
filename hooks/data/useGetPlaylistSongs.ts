import { Song } from "@/types";
import { createClient } from "@/libs/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";
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

      // オフラインの場合は SQLite キャッシュから取得
      if (!isOnline) {
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
      const songsForCache = mappedSongs.map((song) => ({
        id: song.id,
        user_id: song.user_id,
        title: song.title,
        author: song.author,
        song_path: song.song_path,
        image_path: song.image_path,
        duration: song.duration,
        genre: song.genre,
        lyrics: song.lyrics,
        created_at: song.created_at,
      }));
      electronAPI.cache.syncSongsMetadata(songsForCache).catch(console.error);

      const playlistSongsForCache = data.map((item) => ({
        id: item.id,
        playlist_id: item.playlist_id,
        song_id: item.song_id,
        created_at: item.created_at,
      }));
      electronAPI.cache
        .syncPlaylistSongs(playlistSongsForCache)
        .catch(console.error);

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
