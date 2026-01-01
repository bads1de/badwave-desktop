"use client";

import { Song } from "@/types";
import { useQuery, onlineManager } from "@tanstack/react-query";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";
import { createClient } from "@/libs/supabase/client";
import { isNetworkError, electronAPI } from "@/libs/electron/index";

/**
 * ページネーション対応の曲取得結果
 */
interface PaginatedSongsResult {
  songs: Song[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

/**
 * ページネーション対応の曲取得フック
 *
 * Electron環境: ローカルDBから offset/limit でページネーション取得
 * Web環境: Supabase から直接取得
 *
 * @param page - 現在のページ番号 (0-indexed)
 * @param pageSize - 1ページあたりの曲数
 */
const useGetAllSongsPaginated = (page: number = 0, pageSize: number = 24) => {
  const supabase = createClient();
  const offset = page * pageSize;

  const queryKey = [CACHED_QUERIES.songs, "paginated", page, pageSize];

  const { data, isLoading, error, fetchStatus } = useQuery({
    queryKey,
    queryFn: async (): Promise<PaginatedSongsResult> => {
      // Electron環境: ローカルDBから取得
      if (electronAPI.isElectron()) {
        const [songs, totalCount] = await Promise.all([
          electronAPI.cache.getSongsPaginated(offset, pageSize),
          electronAPI.cache.getSongsTotalCount(),
        ]);

        const totalPages = Math.ceil(totalCount / pageSize);

        return {
          songs: (songs as Song[]) || [],
          totalCount,
          totalPages,
          currentPage: page,
        };
      }

      // オフライン時はフェッチをスキップ
      if (!onlineManager.isOnline()) {
        return {
          songs: [],
          totalCount: 0,
          totalPages: 0,
          currentPage: page,
        };
      }

      // Web環境: Supabase から直接取得
      const [songsResult, countResult] = await Promise.all([
        supabase
          .from("songs")
          .select("*")
          .order("created_at", { ascending: false })
          .range(offset, offset + pageSize - 1),
        supabase.from("songs").select("*", { count: "exact", head: true }),
      ]);

      if (songsResult.error) {
        if (!onlineManager.isOnline() || isNetworkError(songsResult.error)) {
          console.log(
            "[useGetAllSongsPaginated] Fetch skipped: offline/network error"
          );
          return {
            songs: [],
            totalCount: 0,
            totalPages: 0,
            currentPage: page,
          };
        }
        console.error("Error fetching songs:", songsResult.error.message);
        throw songsResult.error;
      }

      const totalCount = countResult.count || 0;
      const totalPages = Math.ceil(totalCount / pageSize);

      return {
        songs: (songsResult.data as Song[]) || [],
        totalCount,
        totalPages,
        currentPage: page,
      };
    },
    staleTime: CACHE_CONFIG.staleTime,
    gcTime: CACHE_CONFIG.gcTime,
    retry: false,
    networkMode: "always",
  });

  const isPaused = fetchStatus === "paused";

  return {
    songs: data?.songs || [],
    totalCount: data?.totalCount || 0,
    totalPages: data?.totalPages || 0,
    currentPage: data?.currentPage || 0,
    isLoading,
    error,
    isPaused,
  };
};

export default useGetAllSongsPaginated;
