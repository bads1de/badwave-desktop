import { Song } from "@/types";
import { createClient } from "@/libs/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";
import { electronAPI } from "@/libs/electron-utils";
import { useEffect } from "react";

/**
 * ユーザーがいいねした曲を取得するカスタムフック
 *
 * オフライン対応 (SQLiteキャッシュ使用)
 */
const useGetLikedSongs = (userId?: string) => {
  const supabaseClient = createClient();
  const { isOnline } = useNetworkStatus();

  const queryKey = [CACHED_QUERIES.likedSongs, userId];

  const {
    data: likedSongs = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!userId) {
        return [];
      }

      // オフラインの場合は SQLite キャッシュから取得
      if (!isOnline) {
        try {
          const cachedData = await electronAPI.cache.getCachedLikedSongs(
            userId
          );
          if (cachedData && cachedData.length > 0) {
            return cachedData as Song[];
          }
        } catch (e) {
          console.error("Failed to load liked songs from SQLite cache:", e);
        }
        return [];
      }

      // オンラインの場合は Supabase から取得
      const { data, error } = await supabaseClient
        .from("liked_songs_regular")
        .select("*, songs(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching liked songs:", error);
        throw new Error("いいねした曲の取得に失敗しました");
      }

      if (!data) return [];

      const songs = data.map((item) => ({
        ...item.songs,
        songType: "regular" as const,
      })) as Song[];

      // キャッシュ同期（バックグラウンド）
      const songsForCache = songs.map((song) => ({
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

      const likedSongsForCache = data.map((item) => ({
        user_id: item.user_id,
        song_id: item.song_id,
        created_at: item.created_at,
      }));
      electronAPI.cache.syncLikedSongs(likedSongsForCache).catch(console.error);

      return songs;
    },
    staleTime: CACHE_CONFIG.staleTime,
    gcTime: CACHE_CONFIG.gcTime,
    enabled: !!userId,
    retry: isOnline ? 1 : false,
  });

  useEffect(() => {
    if (isOnline && userId) {
      refetch();
    }
  }, [isOnline, userId, refetch]);

  return { likedSongs, isLoading, error };
};

export default useGetLikedSongs;
