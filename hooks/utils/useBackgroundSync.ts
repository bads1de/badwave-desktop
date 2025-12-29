import { useEffect, useRef } from "react";
import { useUser } from "@/hooks/auth/useUser";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";
import { createClient } from "@/libs/supabase/client";
import { electronAPI } from "@/libs/electron-utils";
import { Song, Playlist } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import { CACHED_QUERIES } from "@/constants";

/**
 * ログイン後にバックグラウンドでライブラリ情報を SQLite に同期するフック
 */
export const useBackgroundSync = () => {
  const { user } = useUser();
  const { isOnline } = useNetworkStatus();
  const supabase = createClient();
  const queryClient = useQueryClient();
  const syncInProgress = useRef(false);

  useEffect(() => {
    // オンラインかつログイン済みの場合のみ同期を実行
    if (!isOnline || !user?.id || !electronAPI.isElectron()) {
      console.log("[Sync] Skip: Offline or Not logged in", {
        isOnline,
        userId: user?.id,
      });
      return;
    }

    if (syncInProgress.current) return;

    const syncLibrary = async () => {
      syncInProgress.current = true;
      console.log("[Sync] Background sync started for user:", user.id);

      try {
        // 1. ユーザーのプレイリストを同期
        const { data: playlistsData, error: pError } = await supabase
          .from("playlists")
          .select("*")
          .eq("user_id", user.id);

        if (pError) throw pError;

        if (playlistsData) {
          await electronAPI.cache.syncPlaylists(playlistsData as Playlist[]);
          console.log(`[Sync] Synced ${playlistsData.length} playlists`);

          // 2. 各プレイリスト内の曲を同期
          for (const playlist of playlistsData) {
            try {
              const { data: playlistSongsData, error: psError } = await supabase
                .from("playlist_songs")
                .select("*, songs(*)")
                .eq("playlist_id", playlist.id)
                .order("created_at", { ascending: false });

              if (psError) {
                console.error(
                  `[Sync] Failed to fetch songs for playlist ${playlist.id}:`,
                  psError
                );
                continue;
              }

              if (playlistSongsData && playlistSongsData.length > 0) {
                const songs = playlistSongsData.map((item: any) => ({
                  ...item.songs,
                  songType: "regular",
                })) as Song[];

                await electronAPI.cache.syncPlaylistSongs({
                  playlistId: String(playlist.id),
                  songs,
                });
                console.log(
                  `[Sync] Synced ${songs.length} songs for playlist "${playlist.title}"`
                );
              }
            } catch (e) {
              console.error(`[Sync] Error syncing playlist ${playlist.id}:`, e);
            }
          }

          // プレイリストのキャッシュが更新されたことを通知
          queryClient.invalidateQueries({
            queryKey: [CACHED_QUERIES.playlists],
          });
        }

        // 3. いいねした曲を同期
        const { data: likedData, error: lError } = await supabase
          .from("liked_songs_regular")
          .select("*, songs(*)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (lError) throw lError;

        if (likedData) {
          const songs = likedData.map((item: any) => ({
            ...item.songs,
            songType: "regular",
          })) as Song[];

          await electronAPI.cache.syncLikedSongs({ userId: user.id, songs });
          console.log(`[Sync] Synced ${songs.length} liked songs`);

          // キャッシュが更新されたことを TanStack Query に通知
          queryClient.invalidateQueries({
            queryKey: [CACHED_QUERIES.likedSongs],
          });
        }

        console.log("[Sync] Background sync completed successfully.");
      } catch (error) {
        console.error("[Sync] Background sync failed:", error);
      } finally {
        syncInProgress.current = false;
      }
    };

    // ログイン直後に実行
    syncLibrary();

    // 1時間ごとに定期実行
    const interval = setInterval(syncLibrary, 1000 * 60 * 60);
    return () => clearInterval(interval);
  }, [isOnline, user?.id, queryClient, supabase]);
};
