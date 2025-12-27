"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import SectionSkeleton from "./sections/SectionSkeleton";

// データ取得フック
import useGetTrendSongs from "@/hooks/data/useGetTrendSongs";
import useGetSpotlight from "@/hooks/data/useGetSpotlight";
import useGetSongs from "@/hooks/data/useGetSongs";
import useGetRecommendations from "@/hooks/data/useGetRecommendations";
import useGetPublicPlaylists from "@/hooks/data/useGetPublicPlaylists";

// 動的インポートによるコード分割
const TrendSection = dynamic(() => import("./sections/TrendSection"), {
  loading: () => (
    <SectionSkeleton
      title="Trending Now"
      description="Loading most popular songs..."
      type="trend"
    />
  ),
  ssr: false,
});

const SpotlightSection = dynamic(() => import("./sections/SpotlightSection"), {
  loading: () => (
    <SectionSkeleton
      title="Spotlight"
      description="Featured artists and songs"
      type="spotlight"
    />
  ),
  ssr: false,
});

const LatestReleasesSection = dynamic(
  () => import("./sections/LatestSection"),
  {
    loading: () => (
      <SectionSkeleton
        title="Latest Releases"
        description="Fresh new music just for you"
        type="latest"
      />
    ),
    ssr: false,
  }
);

const ForYouSection = dynamic(() => import("./sections/ForYouSection"), {
  loading: () => (
    <SectionSkeleton
      title="For You"
      description="Personalized recommendations based on your taste"
      type="forYou"
    />
  ),
  ssr: false,
});

const PlaylistsSection = dynamic(() => import("./sections/PlaylistsSection"), {
  loading: () => (
    <SectionSkeleton
      title="Featured Playlists"
      description="Explore playlists shared by the community"
      type="playlists"
    />
  ),
  ssr: false,
});

const GenreSection = dynamic(() => import("./sections/GenreSection"), {
  loading: () => (
    <SectionSkeleton
      title="Browse by Genre"
      description="Discover music by genre"
      type="genre"
    />
  ),
  ssr: false,
});

const HomeContent: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<
    "all" | "month" | "week" | "day"
  >("all");

  // クライアントサイドでデータを取得（オフライン対応付き）
  const { trends: trendSongs, isLoading: trendLoading } =
    useGetTrendSongs(selectedPeriod);
  const { spotlightData, isLoading: spotlightLoading } = useGetSpotlight();
  const { songs, isLoading: songsLoading } = useGetSongs();
  const { recommendations, isLoading: recommendationsLoading } =
    useGetRecommendations();
  const { playlists, isLoading: playlistsLoading } = useGetPublicPlaylists();

  // メモ化されたコンテンツ
  const content = useMemo(() => {
    return (
      <div className="flex bg-[#0d0d0d] h-full overflow-hidden">
        <div className="w-full h-full overflow-y-auto custom-scrollbar">
          <main className="px-6 py-8 pb-8 space-y-8">
            {/* トレンドボードセクション */}
            {trendLoading ? (
              <SectionSkeleton
                title="Trending Now"
                description="Loading most popular songs..."
                type="trend"
              />
            ) : (
              <TrendSection
                selectedPeriod={selectedPeriod}
                onPeriodChange={setSelectedPeriod}
                initialSongs={trendSongs}
              />
            )}

            {/* スポットライトセクション */}
            {spotlightLoading ? (
              <SectionSkeleton
                title="Spotlight"
                description="Featured artists and songs"
                type="spotlight"
              />
            ) : (
              <SpotlightSection spotlightData={spotlightData} />
            )}

            {/* 最新曲セクション */}
            {songsLoading ? (
              <SectionSkeleton
                title="Latest Releases"
                description="Fresh new music just for you"
                type="latest"
              />
            ) : (
              <LatestReleasesSection songs={songs} />
            )}

            {/* あなたへのおすすめセクション */}
            {recommendationsLoading ? (
              <SectionSkeleton
                title="For You"
                description="Personalized recommendations based on your taste"
                type="forYou"
              />
            ) : (
              <ForYouSection recommendations={recommendations} />
            )}

            {/* パブリックプレイリストセクション */}
            {playlistsLoading ? (
              <SectionSkeleton
                title="Featured Playlists"
                description="Explore playlists shared by the community"
                type="playlists"
              />
            ) : (
              <PlaylistsSection playlists={playlists} />
            )}

            {/* ジャンルボードセクション */}
            <GenreSection />
          </main>
        </div>
      </div>
    );
  }, [
    selectedPeriod,
    trendSongs,
    trendLoading,
    spotlightData,
    spotlightLoading,
    songs,
    songsLoading,
    recommendations,
    recommendationsLoading,
    playlists,
    playlistsLoading,
  ]);

  return content;
};

export default HomeContent;
