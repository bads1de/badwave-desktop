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
  title = "Loading...",
  description = "Please wait",
  height = "h-64",
  type,
}) => {
  // 基本のセクションヘッダー
  const SectionHeader = () => (
    <>
      <h2 className="text-3xl font-bold text-white tracking-tight mb-4">
        {title}
      </h2>
      <p className="text-sm text-neutral-400 mb-6">{description}</p>
    </>
  );

  // トレンドセクション用スケルトン
  const TrendSectionSkeleton = () => (
    <section>
      <SectionHeader />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-36 mt-2" />
        </div>
        <div
          data-testid="trend-period-selector-skeleton"
          className="flex space-x-2"
        >
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-8 w-16" />
          ))}
        </div>
      </div>
      <div className="flex space-x-4 overflow-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            data-testid="trend-card-skeleton"
            className="min-w-[300px]"
          >
            <Skeleton className="w-full h-60 rounded-xl" />
            <div className="p-4 space-y-2">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/4 mt-2" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );

  // スポットライトセクション用スケルトン
  const SpotlightSectionSkeleton = () => (
    <section>
      <SectionHeader />
      <div className="flex space-x-4 overflow-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            data-testid="spotlight-card-skeleton"
            className="flex-none w-40 relative aspect-[9/16]"
          >
            <Skeleton className="w-full h-full rounded-xl" />
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
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            data-testid="song-card-skeleton"
            className="min-w-[200px] w-[200px]"
          >
            <Skeleton className="aspect-square w-full rounded-lg" />
            <div className="mt-2 space-y-2">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-4 w-2/3" />
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
            className="min-w-[200px] max-w-[200px]"
          >
            <Skeleton className="aspect-square w-full rounded-xl" />
            <div className="mt-2 space-y-2">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
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
      <div className="flex space-x-4 overflow-hidden">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            data-testid="genre-card-skeleton"
            className="min-w-[150px] h-32"
          >
            <Skeleton className="w-full h-full rounded-xl" />
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
