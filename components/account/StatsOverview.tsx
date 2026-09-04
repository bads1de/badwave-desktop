"use client";

import React, { useState, memo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import useStats from "@/hooks/data/useStats";
import useColorSchemeStore from "@/hooks/stores/useColorSchemeStore";
import { type StatsPeriod } from "@/types/stats";
import { Flame, Clock, Music, TrendingUp, Calendar, Database } from "lucide-react";
import ContributionHeatmap from "./ContributionHeatmap";
import { twMerge } from "tailwind-merge";

const PERIODS = [
  { value: "week" as const, label: "T_WEEK" },
  { value: "month" as const, label: "T_MONTH" },
  { value: "all" as const, label: "T_ALL" },
];

const GENRE_COLORS = [
  "#8b5cf6",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#6366f1",
  "#84cc16",
  "#a855f7",
];

const StatsOverview: React.FC = memo(() => {
  const [period, setPeriod] = useState<StatsPeriod>("week");
  const { stats, isLoading } = useStats(period);
  const { getColorScheme, hasHydrated } = useColorSchemeStore();
  const colorScheme = getColorScheme();

  const hourlyData = React.useMemo(() => {
    if (!stats?.hourly_activity) return [];
    const fullData = Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}H`,
      count: 0,
    }));
    stats.hourly_activity.forEach((item) => {
      fullData[item.hour].count = item.count;
    });
    return fullData;
  }, [stats?.hourly_activity]);

  const totalPlays = React.useMemo(() => {
    return (
      stats?.hourly_activity?.reduce((sum, item) => sum + item.count, 0) ?? 0
    );
  }, [stats?.hourly_activity]);

  const streak = stats?.streak ?? 0;

  const topGenre = React.useMemo(() => {
    if (!stats?.genre_stats || stats.genre_stats.length === 0) return "NONE";
    return stats.genre_stats[0].genre;
  }, [stats?.genre_stats]);

  const genreData = React.useMemo(() => {
    if (!stats?.genre_stats) return [];
    return stats.genre_stats.map((item) => ({
      name: item.genre,
      value: item.count,
    }));
  }, [stats?.genre_stats]);

  const DAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const weeklyData = React.useMemo(() => {
    const fullData = DAY_NAMES.map((name) => ({ day: name, count: 0 }));
    if (!stats?.weekly_activity) return fullData;
    stats.weekly_activity.forEach((item) => {
      fullData[item.day_of_week].count = item.count;
    });
    return fullData;
  }, [stats?.weekly_activity]);

  if (isLoading) {
    return (
      <div className="space-y-8 font-mono">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-theme-500/5 border border-theme-500/10 p-6 animate-pulse h-24"
            />
          ))}
        </div>
        <div className="bg-theme-500/5 border border-theme-500/10 p-8 animate-pulse h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-10 font-mono">
      <div className="flex justify-end">
        <div className="flex items-center bg-black/40 border border-theme-500/10 p-1 rounded-none">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={twMerge(
                "px-6 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all rounded-none",
                period === p.value
                  ? "bg-theme-500 text-black shadow-[0_0_10px_rgba(var(--theme-500),0.3)]"
                  : "text-theme-500/40 hover:text-theme-500 hover:bg-theme-500/5"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "TOTAL_X_PLAYS", value: totalPlays, icon: Music, unit: "UNITS" },
          { label: "STREAK_ACTIVE", value: streak, icon: Flame, unit: "DAYS" },
          { label: "PRIMARY_GENRE", value: topGenre, icon: TrendingUp, unit: "" },
          { label: "RANKED_NODES", value: stats?.top_songs?.length ?? 0, icon: Clock, unit: "OBJECTS" },
        ].map((stat, i) => (
          <div key={i} className="relative bg-[#0a0a0f] border border-theme-500/10 p-6 group">
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-theme-500/20 group-hover:border-theme-500/60 transition-colors" />
            <div className="flex items-center gap-2 mb-3">
              <stat.icon size={12} className="text-theme-500/60" />
              <span className="text-[8px] text-theme-500/60 font-black uppercase tracking-widest">{stat.label}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-black text-white uppercase tracking-tight truncate max-w-full">
                {stat.value}
              </div>
              <span className="text-[8px] text-theme-500/40 font-black uppercase">{stat.unit}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[#0a0a0f] border border-theme-500/10 p-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-theme-500/20 group-hover:border-theme-500/60" />
        <div className="flex items-center gap-2 mb-6">
          <Calendar size={14} className="text-theme-500" />
          <span className="text-[10px] font-black text-theme-500 uppercase tracking-[0.4em]">METRICS_ACTIVITY_MAP</span>
        </div>
        <ContributionHeatmap
          dailyActivity={stats?.daily_activity ?? null}
          colorScheme={hasHydrated ? colorScheme : undefined}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[#0a0a0f] border border-theme-500/10 p-8 group">
          <div className="flex items-center gap-2 mb-8">
            <Clock size={14} className="text-theme-500" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">
              BUFFER_LOAD_BY_HOUR
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis
                  dataKey="hour"
                  stroke="#theme-500"
                  opacity={0.3}
                  fontSize={8}
                  tickLine={false}
                  interval={5}
                />
                <YAxis stroke="#theme-500" opacity={0.3} fontSize={8} tickLine={false} />
                <Tooltip
                  cursor={{ fill: "rgba(var(--theme-500), 0.05)" }}
                  contentStyle={{
                    backgroundColor: "#0a0a0f",
                    border: "1px solid rgba(var(--theme-500), 0.2)",
                    borderRadius: "0px",
                    fontFamily: "monospace",
                    fontSize: "10px",
                    textTransform: "uppercase",
                  }}
                  itemStyle={{ color: "rgb(var(--theme-500))" }}
                />
                <Bar
                  dataKey="count"
                  fill={hasHydrated ? colorScheme.colors.accentFrom : "#8b5cf6"}
                  radius={0}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#0a0a0f] border border-theme-500/10 p-8 group">
          <div className="flex items-center gap-2 mb-8">
            <Database size={14} className="text-theme-500" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">
              TAG_CLUSTER_DISTRIBUTION
            </span>
          </div>
          <div className="h-64">
            {genreData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genreData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    nameKey="name"
                    stroke="none"
                  >
                    {genreData.map((entry, index) => (
                      <Cell
                        key={`cell-${entry.name}`}
                        fill={GENRE_COLORS[index % GENRE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0a0a0f",
                      border: "1px solid rgba(var(--theme-500), 0.2)",
                      borderRadius: "0px",
                      fontFamily: "monospace",
                      fontSize: "10px",
                      textTransform: "uppercase",
                    }}
                    itemStyle={{ color: "#fff" }}
                    labelStyle={{ color: "rgba(var(--theme-500), 0.8)" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-[10px] font-black text-theme-500/20 uppercase tracking-[0.4em]">
                NO_DATA_AVAILABLE
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-[#0a0a0f] border border-theme-500/10 p-8 group">
        <div className="flex items-center gap-2 mb-8">
          <Calendar size={14} className="text-theme-500" />
          <span className="text-[10px] font-black text-white uppercase tracking-widest">
            LOG_VOLUME_BY_WEEKDAY
          </span>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis
                dataKey="day"
                stroke="#theme-500"
                opacity={0.3}
                fontSize={8}
                tickLine={false}
              />
              <YAxis stroke="#theme-500" opacity={0.3} fontSize={8} tickLine={false} />
              <Tooltip
                cursor={{ fill: "rgba(var(--theme-500), 0.05)" }}
                contentStyle={{
                  backgroundColor: "#0a0a0f",
                  border: "1px solid rgba(var(--theme-500), 0.2)",
                  borderRadius: "0px",
                  fontFamily: "monospace",
                  fontSize: "10px",
                  textTransform: "uppercase",
                }}
                itemStyle={{ color: "#fff" }}
                labelStyle={{ color: "rgba(var(--theme-500), 0.8)" }}
              />
              <Bar
                dataKey="count"
                fill={hasHydrated ? colorScheme.colors.primary : "#06b6d4"}
                radius={0}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
});

StatsOverview.displayName = "StatsOverview";

export default StatsOverview;
