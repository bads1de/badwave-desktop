"use client";

import { Song } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { CACHED_QUERIES } from "@/constants";
import getTrendSongs from "@/actions/getTrendSongs";

/**
 * 指定された期間に基づいてトレンド曲を取得するカスタムフック
 *
 * @param {"all" | "month" | "week" | "day"} period - 取得する期間
 * @param {Song[]} initialData - サーバーから取得した初期データ
 * @returns {Object} トレンド曲の取得状態と結果
 * @property {Song[]} trends - 取得したトレンド曲のリスト
 * @property {boolean} isLoading - データ取得中かどうか
 * @property {string|null} error - エラーメッセージ
 */
const useGetTrendSongs = (
  period: "all" | "month" | "week" | "day" = "all",
  initialData: Song[] = []
) => {
  const {
    data: trends = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: [CACHED_QUERIES.trendSongs, period],
    queryFn: () => getTrendSongs(period),
    initialData: period === "all" ? initialData : undefined,
    // キャッシュ設定を直接宣言
    staleTime: 1000 * 60 * 60 * 24, // 1日間
    gcTime: 1000 * 60 * 60 * 24, // 1日間
    // 初期データがある場合かつ「全期間」の場合は再取得しない
    enabled: !(period === "all" && initialData.length > 0),
  });

  if (error) {
    console.error("トレンドデータの取得に失敗しました。", error);
  }

  return { trends, isLoading, error };
};

export default useGetTrendSongs;
