"use client";

import React, { memo, useMemo } from "react";
import type { DailyActivity } from "@/types/stats";

interface ContributionHeatmapProps {
  dailyActivity: DailyActivity[] | null;
  colorScheme?: {
    colors: {
      accentFrom: string;
      primary: string;
    };
  };
}

// 色の濃淡レベル (0=なし, 1=薄い, 2, 3, 4=濃い)
const getColorLevel = (count: number, maxCount: number): number => {
  if (count === 0) return 0;
  if (maxCount === 0) return 0;
  const ratio = count / maxCount;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
};

// デフォルトカラー (GitHub風グリーン)
const DEFAULT_COLORS = [
  "#161b22", // level 0: 背景
  "#0e4429", // level 1
  "#006d32", // level 2
  "#26a641", // level 3
  "#39d353", // level 4
];

const ContributionHeatmap: React.FC<ContributionHeatmapProps> = memo(
  ({ dailyActivity, colorScheme }) => {
    // 過去1年分の日付を生成
    const { weeks, monthLabels, maxCount, activityMap } = useMemo(() => {
      const today = new Date();
      const oneYearAgo = new Date(today);
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      // アクティビティをMapに変換
      const activityMap = new Map<string, number>();
      dailyActivity?.forEach((item) => {
        activityMap.set(item.date, item.count);
      });

      // 最大値を計算
      const maxCount = Math.max(
        1,
        ...(dailyActivity?.map((d) => d.count) ?? [1])
      );

      // 週ごとにグループ化
      const weeks: { date: Date; count: number }[][] = [];
      let currentWeek: { date: Date; count: number }[] = [];

      // 最初の週の開始日（日曜日）に調整
      const startDate = new Date(oneYearAgo);
      startDate.setDate(startDate.getDate() - startDate.getDay());

      const currentDate = new Date(startDate);
      while (currentDate <= today) {
        const dateStr = currentDate.toISOString().split("T")[0];
        const count = activityMap.get(dateStr) ?? 0;

        currentWeek.push({ date: new Date(currentDate), count });

        if (currentWeek.length === 7) {
          weeks.push(currentWeek);
          currentWeek = [];
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      // 残りの日があれば追加
      if (currentWeek.length > 0) {
        weeks.push(currentWeek);
      }

      // 月ラベル計算
      const monthLabels: { month: string; weekIndex: number }[] = [];
      let lastMonth = -1;
      weeks.forEach((week, weekIndex) => {
        const firstDayOfWeek = week[0];
        if (firstDayOfWeek) {
          const month = firstDayOfWeek.date.getMonth();
          if (month !== lastMonth) {
            const monthNames = [
              "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
              "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"
            ];
            monthLabels.push({ month: monthNames[month], weekIndex });
            lastMonth = month;
          }
        }
      });

      return { weeks, monthLabels, maxCount, activityMap };
    }, [dailyActivity]);

    // カラーパレット生成
    const colors = useMemo(() => {
      if (!colorScheme) return DEFAULT_COLORS;
      // テーマカラーに基づいて濃淡を生成
      const baseColor = colorScheme.colors.accentFrom;
      return [
        "#0a0a0f", // 深い黒
        `${baseColor}20`,
        `${baseColor}50`,
        `${baseColor}80`,
        baseColor,
      ];
    }, [colorScheme]);

    const dayLabels = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

    return (
      <div className="bg-[#0a0a0f]/80 backdrop-blur-xl border border-theme-500/20 rounded-none p-8 font-mono relative overflow-hidden group">
        {/* 背景装飾 */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
             style={{ 
               backgroundImage: `linear-gradient(rgba(var(--theme-500), 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--theme-500), 0.5) 1px, transparent 1px)`,
               backgroundSize: '20px 20px'
             }} 
        />
        
        {/* HUDコーナー */}
        <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-theme-500/40" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-theme-500/40" />

        <div className="mb-8 border-l-4 border-theme-500 pl-4 relative z-10">
          <p className="text-[10px] text-theme-500/60 uppercase tracking-[0.4em] mb-1">
            [ SYSTEM_ACTIVITY_MATRIX ]
          </p>
          <h3 className="text-2xl font-black text-white uppercase tracking-widest drop-shadow-[0_0_8px_rgba(var(--theme-500),0.5)]">
            TEMPORAL_ENGAGEMENT
          </h3>
        </div>

        <div className="overflow-x-auto relative z-10 custom-scrollbar pb-4">
          <div className="inline-block min-w-max">
            {/* 月ラベル */}
            <div
              className="relative ml-10 mb-2"
              style={{ height: "16px", width: weeks.length * 14 }}
            >
              {monthLabels.map((label, idx) => (
                <div
                  key={idx}
                  className="text-[10px] font-bold text-theme-500/60 absolute tracking-tighter"
                  style={{
                    left: label.weekIndex * 14,
                  }}
                >
                  {label.month}
                </div>
              ))}
            </div>

            <div className="flex">
              {/* 曜日ラベル */}
              <div className="flex flex-col gap-[3px] mr-2">
                {dayLabels.map((day, idx) => (
                  <div
                    key={day}
                    className="text-[8px] font-bold text-theme-500/40 h-[12px] flex items-center uppercase"
                    style={{ visibility: idx % 2 === 1 ? "visible" : "hidden" }}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* ヒートマップ */}
              <div className="flex gap-[3px]">
                {weeks.map((week, weekIdx) => (
                  <div key={weekIdx} className="flex flex-col gap-[3px]">
                    {week.map((day, dayIdx) => {
                      const level = getColorLevel(day.count, maxCount);
                      const dateStr = day.date.toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      });
                      return (
                        <div
                          key={dayIdx}
                          className={`w-[12px] h-[12px] rounded-none cursor-pointer transition-all duration-300 border border-white/5 hover:border-white/40 hover:scale-125 ${level > 0 ? "shadow-[0_0_5px_rgba(var(--theme-500),0.2)]" : ""}`}
                          style={{ backgroundColor: colors[level] }}
                          title={`${dateStr}: ${day.count}_PLAYS_DETECTED`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* 凡例 */}
            <div className="flex items-center justify-end gap-3 mt-6 text-[8px] font-bold text-theme-500/40 uppercase tracking-widest">
              <span>STREAM_IDLE</span>
              <div className="flex gap-[2px]">
                {colors.map((color, idx) => (
                  <div
                    key={idx}
                    className="w-[10px] h-[10px] rounded-none border border-white/5"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <span className="text-theme-500">MAX_BANDWIDTH</span>
            </div>
          </div>
        </div>
        
        {/* 装飾用HUDライン */}
        <div className="mt-6 text-[7px] text-theme-500/20 uppercase tracking-widest italic text-right">
           matrix_integrity: 99.8% // visualization_mode: active
        </div>
      </div>
    );
  }
);

ContributionHeatmap.displayName = "ContributionHeatmap";

export default ContributionHeatmap;
