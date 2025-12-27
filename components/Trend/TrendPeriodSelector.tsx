"use client";

import { cn } from "@/libs/utils";

const TREND_PERIODS = [
  { label: "All Time", value: "all" },
  { label: "This Month", value: "month" },
  { label: "This Week", value: "week" },
  { label: "Today", value: "day" },
] as const;

type TrendPeriod = (typeof TREND_PERIODS)[number]["value"];

interface TrendPeriodSelectorProps {
  selectedPeriod: TrendPeriod;
  onPeriodChange: (period: TrendPeriod) => void;
}

const TrendPeriodSelector: React.FC<TrendPeriodSelectorProps> = ({
  selectedPeriod,
  onPeriodChange,
}) => {
  return (
    <div className="inline-flex h-10 items-center justify-center rounded-xl bg-neutral-900/40 backdrop-blur-xl border border-white/[0.02] p-1">
      {TREND_PERIODS.map((period) => (
        <button
          key={period.value}
          onClick={() => onPeriodChange(period.value)}
          className={cn(
            "inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-300",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-500/50 focus-visible:ring-offset-2",
            "disabled:pointer-events-none disabled:opacity-50",
            selectedPeriod === period.value
              ? "bg-gradient-to-br rounded-xl from-theme-500/20 to-theme-900/20 border border-theme-500/30 text-white shadow-lg shadow-theme-500/20"
              : "text-neutral-400 hover:text-white hover:bg-neutral-800/50 rounded-xl"
          )}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
};

export default TrendPeriodSelector;
