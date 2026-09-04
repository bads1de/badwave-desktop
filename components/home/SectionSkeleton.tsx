import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

type SectionType =
  | "trend"
  | "spotlight"
  | "latest"
  | "forYou"
  | "playlists"
  | "genre";

interface SectionSkeletonProps {
  title?: string;
  description?: string;
  height?: string;
  type?: SectionType;
}

/**
 * セクションのスケルトンローディングコンポーネント
 *
 * @param title - セクションタイトル
 * @param description - セクション説明
 * @param height - スケルトンの高さ（typeが指定されていない場合のみ使用）
 * @param type - セクションタイプ（指定するとそのセクション専用のスケルトンが表示される）
 */
const SectionSkeleton: React.FC<SectionSkeletonProps> = ({
  title = "LOADING...",
  description = "INITIALIZING_STREAM",
  height = "h-64",
  type,
}) => {
  // 基本のセクションヘッダー (Cyberpunk Style)
  const SectionHeader = () => (
    <div className="flex items-center gap-x-4 mb-6 animate-pulse">
      <div className="h-10 w-1 bg-theme-500 shadow-[0_0_15px_rgba(var(--theme-500),0.8)]" />
      <div className="relative">
        <h2 className="text-3xl font-bold text-white tracking-[0.2em] uppercase font-mono drop-shadow-[0_0_8px_rgba(var(--theme-500),0.5)]">
          {title}
        </h2>
        <p className="text-[10px] text-theme-500/60 mt-1 font-mono tracking-widest uppercase flex items-center gap-2">
          <span className="w-1 h-1 bg-theme-500 rounded-full animate-ping" />
          // {description}
        </p>
        {/* スキャンライン装飾 */}
        <div className="absolute -bottom-1 left-0 w-full h-[1px] bg-gradient-to-r from-theme-500/40 via-transparent to-transparent" />
      </div>
    </div>
  );

  // トレンドセクション用スケルトン
  const TrendSectionSkeleton = () => (
    <section className="relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <SectionHeader />
        <div
          data-testid="trend-period-selector-skeleton"
          className="flex space-x-2 bg-theme-900/20 p-1 border border-theme-500/20"
        >
          {[1, 2, 3, 4].map((i) => (
            <Skeleton
              key={i}
              className="h-10 w-24 bg-theme-500/10 border border-theme-500/10 rounded-xl relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-theme-500/10 to-transparent animate-scanline-skeleton" />
            </Skeleton>
          ))}
        </div>
      </div>
      <div className="flex space-x-4 overflow-hidden p-6 bg-[#0a0a0f]/40 border border-theme-500/10 rounded-xl relative">
        {/* HUD装飾コーナー */}
        <div className="absolute top-0 right-0 w-12 h-12 border-t border-r border-theme-500/20" />
        <div className="absolute bottom-0 left-0 w-12 h-12 border-b border-l border-theme-500/20" />

        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            data-testid="trend-card-skeleton"
            className="min-w-[320px] bg-theme-900/20 border border-theme-500/10 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-theme-500/5 to-transparent animate-scanline-skeleton z-10" />
            <Skeleton className="w-full h-64 rounded-xl bg-theme-500/5" />
            <div className="p-4 space-y-3 font-mono">
              <Skeleton className="h-6 w-3/4 bg-theme-500/10" />
              <Skeleton className="h-4 w-1/2 bg-theme-500/5" />
              <div className="pt-3 border-t border-theme-500/10 flex justify-between">
                <Skeleton className="h-3 w-1/4 bg-theme-500/5" />
                <Skeleton className="h-2 w-2 rounded-full bg-theme-500/20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );

  // スポットライトセクション用スケルトン
  const SpotlightSectionSkeleton = () => (
    <section tabIndex={0}>
      <SectionHeader />
      <div className="flex space-x-4 overflow-hidden p-6 bg-[#0a0a0f]/40 border border-theme-500/10 rounded-xl relative">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            data-testid="spotlight-card-skeleton"
            className="flex-none w-40 relative aspect-[9/16] overflow-hidden"
          >
            <Skeleton className="w-full h-full rounded-xl bg-theme-500/10 border border-theme-500/20 shadow-[inset_0_0_10px_rgba(var(--theme-500),0.1)]" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-theme-500/10 to-transparent animate-scanline-skeleton" />
          </div>
        ))}
      </div>
    </section>
  );

  // 曲カードスケルトン（Latest, ForYou共通）
  const SongCardsSkeleton = () => (
    <section>
      <SectionHeader />
      <div className="flex space-x-4 overflow-hidden">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            data-testid="song-card-skeleton"
            className="min-w-[200px] w-[200px] bg-[#0a0a0f]/40 border border-theme-500/10 rounded-xl p-3 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-theme-500/5 to-transparent animate-scanline-skeleton" />
            <Skeleton className="aspect-square w-full rounded-xl bg-theme-500/5 border border-theme-500/10" />
            <div className="mt-4 space-y-2">
              <Skeleton className="h-5 w-full bg-theme-500/10" />
              <Skeleton className="h-3 w-2/3 bg-theme-500/5" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );

  // プレイリストセクション用スケルトン
  const PlaylistsSectionSkeleton = () => (
    <section>
      <SectionHeader />
      <div className="flex space-x-4 overflow-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            data-testid="playlist-card-skeleton"
            className="min-w-[200px] max-w-[200px] bg-[#0a0a0f]/40 border border-theme-500/10 rounded-xl p-4 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-theme-500/5 to-transparent animate-scanline-skeleton" />
            <Skeleton className="aspect-square w-full rounded-xl bg-theme-500/5" />
            <div className="mt-4 space-y-2 font-mono">
              <Skeleton className="h-4 w-full bg-theme-500/10" />
              <Skeleton className="h-2 w-1/2 bg-theme-500/5" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );

  // ジャンルセクション用スケルトン
  const GenreSectionSkeleton = () => (
    <section>
      <SectionHeader />
      <div className="flex space-x-4 overflow-hidden p-8 bg-[#0a0a0f]/60 border-y border-theme-500/10 relative">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            data-testid="genre-card-skeleton"
            className="min-w-[150px] h-32 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-theme-500/5 to-transparent animate-scanline-skeleton" />
            <Skeleton className="w-full h-full rounded-xl bg-theme-500/5 border border-theme-500/20 shadow-[0_0_10px_rgba(var(--theme-500),0.1)]" />
          </div>
        ))}
      </div>
    </section>
  );

  // タイプに応じたスケルトンを返す
  if (type === "trend") return <TrendSectionSkeleton />;
  if (type === "spotlight") return <SpotlightSectionSkeleton />;
  if (type === "latest" || type === "forYou") return <SongCardsSkeleton />;
  if (type === "playlists") return <PlaylistsSectionSkeleton />;
  if (type === "genre") return <GenreSectionSkeleton />;

  // タイプが指定されていない場合は汎用的なスケルトンを返す
  return (
    <section>
      <SectionHeader />
      <Skeleton className={`w-full ${height}`} />
    </section>
  );
};

export default SectionSkeleton;
