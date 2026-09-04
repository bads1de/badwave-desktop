"use client";

import { Song, PaginatedSongsResult } from "@/types";
import { CACHED_QUERIES, TABLES } from "@/constants";
import { createClient } from "@/libs/supabase/client";
import { electronAPI } from "@/libs/electron";
import { useSectionQuery } from "@/libs/query/useSectionQuery";
import { getErrorMessage } from "@/libs/utils/error";

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
  const offset = page * pageSize;

  const {
    data = {
      songs: [],
      totalCount: 0,
      totalPages: 0,
      currentPage: page,
    },
    isLoading,
    error,
    isPaused,
  } = useSectionQuery<PaginatedSongsResult>({
    queryKey: [CACHED_QUERIES.songs, "paginated", page, pageSize],
    networkMode: "always",
    electron: {
      getLocal: async () => {
        const [songs, totalCount] = await Promise.all([
          electronAPI.cache.getSongsPaginated(offset, pageSize),
          electronAPI.cache.getSongsTotalCount(),
        ]);

        return {
          songs: (songs as Song[]) || [],
          totalCount,
          totalPages: Math.ceil(totalCount / pageSize),
          currentPage: page,
        };
      },
    },
    webFn: async () => {
      const [songsResult, countResult] = await Promise.all([
        createClient()
          .from(TABLES.SONGS)
          .select("*")
          .order("created_at", { ascending: false })
          .range(offset, offset + pageSize - 1),
        createClient()
          .from(TABLES.SONGS)
          .select("*", { count: "exact", head: true }),
      ]);

      if (songsResult.error) {
        throw songsResult.error;
      }

      const totalCount = countResult.count || 0;

      return {
        songs: (songsResult.data as Song[]) || [],
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        currentPage: page,
      };
    },
    offlineFallback: {
      songs: [],
      totalCount: 0,
      totalPages: 0,
      currentPage: page,
    },
  });

  return {
    songs: data.songs,
    totalCount: data.totalCount,
    totalPages: data.totalPages,
    currentPage: data.currentPage,
    isLoading,
    error,
    isPaused,
  };
};

export default useGetAllSongsPaginated;