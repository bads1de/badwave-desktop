"use client";

import { useState } from "react";

import { Playlist, Song, Spotlight } from "@/types";

// データ取得フック - ForYouのみクライアントサイドフェッチ（ユーザー固有データ）
import useGetRecommendations from "@/hooks/data/useGetRecommendations";

// セクションコンポーネント
import TrendSection from "./sections/TrendSection";
import SpotlightSection from "./sections/SpotlightSection";
import LatestReleasesSection from "./sections/LatestSection";
import ForYouSection from "./sections/ForYouSection";
import PlaylistsSection from "./sections/PlaylistsSection";
import GenreSection from "./sections/GenreSection";
import SectionSkeleton from "./sections/SectionSkeleton";

interface HomeContentProps {
  initialData?: {
    trendSongs?: Song[];
    spotlightData?: Spotlight[];
    latestSongs?: Song[];
    publicPlaylists?: Playlist[];
  };
}

/**
 * ホームページのメインコンテンツコンポーネント
 *
 * SSRで取得したデータを直接使用し、クライアントサイドフェッチを最小限に抑える。
 * - Trend, Spotlight, Latest, Playlists: SSRデータを直接使用
 * - ForYou: ユーザー固有データなのでクライアントサイドフェッチ
 * - Trend期間変更: TrendSection内でクライアントサイドフェッチ
 */
const HomeContent: React.FC<HomeContentProps> = ({ initialData }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<
    "all" | "month" | "week" | "day"
  >("all");

  // ForYouのみクライアントサイドフェッチ（ユーザーIDに依存）
  const { recommendations, isLoading: recommendationsLoading } =
    useGetRecommendations();

  return (
    <div className="flex bg-[#0d0d0d] h-full overflow-hidden">
      <div className="w-full h-full overflow-y-auto custom-scrollbar">
        <main className="px-6 py-8 pb-8 space-y-8">
          {/* トレンドボードセクション - 期間変更はTrendSection内で処理 */}
          <TrendSection
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
            initialSongs={initialData?.trendSongs}
          />

          {/* スポットライトセクション - SSRデータを直接使用 */}
          <SpotlightSection spotlightData={initialData?.spotlightData || []} />

          {/* 最新曲セクション - SSRデータを直接使用 */}
          <LatestReleasesSection songs={initialData?.latestSongs || []} />

          {/* あなたへのおすすめセクション - クライアントサイドフェッチ */}
          {recommendationsLoading ? (
            <SectionSkeleton
              title="For You"
              description="Personalized recommendations based on your taste"
              type="forYou"
            />
          ) : (
            <ForYouSection recommendations={recommendations} />
          )}

          {/* パブリックプレイリストセクション - SSRデータを直接使用 */}
          <PlaylistsSection playlists={initialData?.publicPlaylists || []} />

          {/* ジャンルボードセクション - 静的データ */}
          <GenreSection />
        </main>
      </div>
    </div>
  );
};

export default HomeContent;
