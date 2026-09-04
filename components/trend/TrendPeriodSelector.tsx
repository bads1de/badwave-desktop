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
    <div className="inline-flex h-10 items-center justify-center rounded-none bg-[#0a0a0f] border border-theme-500/20 p-1 font-mono uppercase tracking-widest">
      {TREND_PERIODS.map((period) => (
        <button
          key={period.value}
          onClick={() => onPeriodChange(period.value)}
          className={cn(
            "inline-flex items-center justify-center whitespace-nowrap rounded-none px-4 py-1.5 text-[10px] font-black transition-all duration-300",
            "focus-visible:outline-none",
            "disabled:pointer-events-none disabled:opacity-50",
            selectedPeriod === period.value
              ? "bg-theme-500/20 text-white border border-theme-500/40 shadow-[0_0_10px_rgba(var(--theme-500),0.3)] relative cyber-glitch"
              : "text-theme-500/40 hover:text-theme-300 hover:bg-theme-500/5"
          )}
        >
          {selectedPeriod === period.value && (
            <span className="absolute -top-1 -right-1 w-1 h-1 bg-theme-500 animate-pulse" />
          )}
          {period.label}
        </button>
      ))}
    </div>
  );
};

export default TrendPeriodSelector;
