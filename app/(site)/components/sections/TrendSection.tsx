"use client";

import { memo } from "react";
import TrendBoard from "@/components/Trend/TrendBoard";
import TrendPeriodSelector from "@/components/Trend/TrendPeriodSelector";
import { Song } from "@/types";
import useGetTrendSongs from "@/hooks/data/useGetTrendSongs";

interface TrendSectionProps {
  selectedPeriod: "all" | "month" | "week" | "day";
  onPeriodChange: (period: "all" | "month" | "week" | "day") => void;
  initialSongs?: Song[];
}

/**
 * トレンドセクションコンポーネント
 *
 * @param selectedPeriod - 選択された期間
 * @param onPeriodChange - 期間変更時のコールバック
 * @param initialSongs - SSRで取得した初期トレンドデータ
 */
const TrendSection: React.FC<TrendSectionProps> = ({
  selectedPeriod,
  onPeriodChange,
  initialSongs,
}: TrendSectionProps) => {
  // 期間変更に対応するためのクライアントサイドフェッチ
  // selectedPeriod === "all" の場合は initialSongs を使用
  const { trends, isLoading, error } = useGetTrendSongs(
    selectedPeriod,
    initialSongs
  );

  // 実際に表示するデータ: フェッチ結果があればそれを使用、なければinitialSongs
  const displaySongs = trends.length > 0 ? trends : initialSongs || [];

  return (
    <section>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">
            Trending Now
          </h2>
          <p className="text-sm text-neutral-400 mt-2">
            Most popular songs this {selectedPeriod}
          </p>
        </div>
        <TrendPeriodSelector
          selectedPeriod={selectedPeriod}
          onPeriodChange={onPeriodChange}
        />
      </div>
      <TrendBoard songs={displaySongs} isLoading={isLoading} error={error} />
    </section>
  );
};

// メモ化されたコンポーネントをエクスポート
TrendSection.displayName = "TrendSection";
export default memo(TrendSection);
