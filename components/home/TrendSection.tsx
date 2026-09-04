"use client";

import { memo } from "react";
import TrendBoard from "@/components/trend/TrendBoard";
import TrendPeriodSelector from "@/components/trend/TrendPeriodSelector";
import { Song } from "@/types";

interface TrendSectionProps {
  selectedPeriod: "all" | "month" | "week" | "day";
  onPeriodChange: (period: "all" | "month" | "week" | "day") => void;
  songs: Song[];
}

/**
 * トレンドセクションコンポーネント
 *
 * @param selectedPeriod - 選択された期間
 * @param onPeriodChange - 期間変更時のコールバック
 * @param songs - トレンドデータ
 */
const TrendSection: React.FC<TrendSectionProps> = ({
  selectedPeriod,
  onPeriodChange,
  songs,
}: TrendSectionProps) => {
  return (
    <section className="relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 group/header px-1 sm:px-2">
        <div className="flex items-center gap-x-4">
          <div className="h-12 w-1.5 bg-theme-500 shadow-[0_0_20px_rgba(var(--theme-500),1)] animate-pulse" />
          <div>
            <h2 className="text-4xl font-bold text-white tracking-[0.2em] uppercase font-mono drop-shadow-[0_0_12px_rgba(var(--theme-500),0.8)]">
              TRENDING_NOW
            </h2>
            <p className="text-[10px] text-theme-500/60 mt-1 font-mono tracking-widest uppercase">
              // ANALYZING_GLOBAL_STREAM_METRICS
            </p>
          </div>
        </div>
        <TrendPeriodSelector
          selectedPeriod={selectedPeriod}
          onPeriodChange={onPeriodChange}
        />
      </div>
      <div className="relative p-6 bg-[#0a0a0f]/40 border border-theme-500/10 rounded-2xl shadow-[inset_0_0_30px_rgba(var(--theme-500),0.05)]">
        {/* HUD装飾コーナー */}
        <div className="absolute top-0 right-0 w-12 h-12 border-t border-r border-theme-500/20 pointer-events-none rounded-tr-2xl" />
        <div className="absolute bottom-0 left-0 w-12 h-12 border-b border-l border-theme-500/20 pointer-events-none rounded-bl-2xl" />

        <TrendBoard songs={songs} />
      </div>
    </section>
  );
};

// メモ化されたコンポーネントをエクスポート
TrendSection.displayName = "TrendSection";
export default memo(TrendSection);

