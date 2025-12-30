import { useEffect, useRef, useCallback } from "react";
import { useUser } from "@/hooks/auth/useUser";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";
import { createClient } from "@/libs/supabase/client";
import { electronAPI } from "@/libs/electron/index";
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
  const shouldRetrySync = useRef(false);

  // isOnline の最新値を常に保持する ref
  const isOnlineRef = useRef(isOnline);
  useEffect(() => {
    isOnlineRef.current = isOnline;
  }, [isOnline]);

  const syncLibrary = useCallback(async () => {
    // オフライン、未ログイン、Electronでない場合はスキップ
    if (!isOnlineRef.current || !user?.id || !electronAPI.isElectron()) {
      if (!isOnlineRef.current) {
        console.log("[Sync] Skipped: Offline");
      }
      return;
    }

    // 既に実行中の場合
    if (syncInProgress.current) {
      // オンラインであれば、現在の処理が終わった後に再試行するように予約する
      if (isOnlineRef.current) {
        console.log("[Sync] Sync already in progress, scheduling retry");
        shouldRetrySync.current = true;
      }
      return;
    }

    syncInProgress.current = true;
    shouldRetrySync.current = false; // フラグをリセット
    console.log("[Sync] Background sync started for user:", user.id);

    try {
      // --- 1. ユーザーのプレイリストを同期 ---
      if (!isOnlineRef.current) throw new Error("Offline detected");

      const { data: playlistsData, error: pError } = await supabase
        .from("playlists")
        .select("*")
        .eq("user_id", user.id);

      if (pError) throw pError;

      if (playlistsData) {
        await electronAPI.cache.syncPlaylists(playlistsData as Playlist[]);
        console.log(`[Sync] Synced ${playlistsData.length} playlists`);

        // --- 2. 各プレイリスト内の曲を同期 ---
        for (const playlist of playlistsData) {
          // ループの各ステップでオフラインチェック
          if (!isOnlineRef.current) {
            console.log("[Sync] Paused: Connection lost");
            break;
          }

          try {
            const { data: playlistSongsData, error: psError } = await supabase
              .from("playlist_songs")
              .select("*, songs(*)")
              .eq("playlist_id", playlist.id)
              .order("created_at", { ascending: false });

            if (psError) {
              // オフラインによるエラーならスローして親のcatchで処理
              if (!isOnlineRef.current) throw new Error("Offline detected");
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
            // 個別のプレイリスト同期エラーは全体の停止にはしないが、オフラインならループを抜ける
            if (!isOnlineRef.current) break;
            console.error(`[Sync] Error syncing playlist ${playlist.id}:`, e);
          }
        }

        // プレイリストのキャッシュが更新されたことを通知
        queryClient.invalidateQueries({
          queryKey: [CACHED_QUERIES.playlists],
        });
      }

      // --- 3. いいねした曲を同期 ---
      if (isOnlineRef.current) {
        const { data: likedData, error: lError } = await supabase
          .from("liked_songs_regular")
          .select("*, songs(*)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (lError) {
          if (!isOnlineRef.current) throw new Error("Offline detected");
          throw lError;
        }

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
      }

      if (isOnlineRef.current) {
        console.log("[Sync] Background sync completed successfully.");
      } else {
        console.log("[Sync] Background sync paused due to offline.");
      }
    } catch (error) {
      // エラーハンドリング: オフラインが原因の場合はログレベルを下げる
      if (!isOnlineRef.current) {
        console.log("[Sync] Operation paused/canceled due to network loss.");
      } else {
        console.error("[Sync] Background sync failed:", error);
      }
    } finally {
      syncInProgress.current = false;
      // リトライが予約されていて、かつ現在オンラインであれば即座に再実行
      if (shouldRetrySync.current && isOnlineRef.current) {
        console.log("[Sync] Retrying sync as scheduled...");
        // 再帰呼び出しを防ぐため、次のティックで実行（またはPromiseチェーンを使う）
        // ここではシンプルに関数を再呼び出しする（非同期なのでスタックオーバーフローはしない）
        syncLibrary();
      }
    }
  }, [user?.id, queryClient, supabase]);

  useEffect(() => {
    // ログイン直後、かつオンラインになったタイミングで同期を試みる
    if (isOnline && user?.id) {
      syncLibrary();
    }

    // 定期実行 (setInterval はオンライン時のみ有効にするなどの制御も可能だが、
    // syncLibrary内部でチェックしているのでこのままでOK)
    const interval = setInterval(syncLibrary, 1000 * 60 * 60);
    return () => clearInterval(interval);
  }, [isOnline, user?.id, syncLibrary]);
};
