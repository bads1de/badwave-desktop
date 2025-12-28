import { Playlist } from "@/types";
import { createClient } from "@/libs/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";
import { electronAPI } from "@/libs/electron-utils";
import { useUser } from "@/hooks/auth/useUser";
import { useEffect } from "react";

/**
 * プレイリスト情報を取得するカスタムフック
 *
 * オフライン対応: SQLiteキャッシュから取得
 */
const useGetPlaylist = (playlistId?: string) => {
  const supabaseClient = createClient();
  const { isOnline } = useNetworkStatus();
  const { user } = useUser();

  const queryKey = [CACHED_QUERIES.playlists, playlistId, isOnline];

  const {
    data: playlist,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!playlistId) {
        return null;
      }

      // 直接オフライン状態を確認（クロージャのタイミング問題を回避）
      let isCurrentlyOffline = !isOnline;
      if (electronAPI.isElectron()) {
        try {
          const status = await (
            window as any
          ).electron.dev.getOfflineSimulationStatus();
          isCurrentlyOffline = status.isOffline;
        } catch {}
      }

      // オフラインの場合はSQLiteキャッシュから取得
      if (isCurrentlyOffline) {
        // user.id がなくても、ローカルキャッシュからユーザーIDを取得して試す
        let userId = user?.id;
        if (!userId && electronAPI.isElectron()) {
          try {
            const cachedUser = await electronAPI.auth.getCachedUser();
            userId = cachedUser?.id;
          } catch {}
        }

        if (userId) {
          try {
            const cachedPlaylists = await electronAPI.cache.getCachedPlaylists(
              userId
            );
            if (cachedPlaylists) {
              const found = cachedPlaylists.find(
                (p: Playlist) => String(p.id) === String(playlistId)
              );
              if (found) {
                return found as Playlist;
              }
            }
          } catch (e) {
            console.error("Failed to load playlist from SQLite cache:", e);
          }
        }
        // オフラインでキャッシュがない場合はnullを返す（エラーは投げない）
        return null;
      }

      const { data, error } = await supabaseClient
        .from("playlists")
        .select("*")
        .eq("id", playlistId)
        .single();

      if (error) {
        console.error("Error fetching playlist:", error);
        throw new Error("プレイリストの取得に失敗しました");
      }

      return data as Playlist;
    },
    staleTime: CACHE_CONFIG.staleTime,
    gcTime: CACHE_CONFIG.gcTime,
    enabled: !!playlistId,
    retry: isOnline ? 1 : false,
  });

  // オンラインに戻ったときに再取得
  useEffect(() => {
    if (isOnline && playlistId) {
      refetch();
    }
  }, [isOnline, playlistId, refetch]);

  return {
    playlist,
    isLoading,
    error,
  };
};

export default useGetPlaylist;
