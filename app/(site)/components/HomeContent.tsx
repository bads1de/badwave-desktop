"use client";

import { useState, useMemo } from "react";
// dynamic import removed
import SectionSkeleton from "./sections/SectionSkeleton";

import { Playlist, Song, Spotlight } from "@/types";

// データ取得フック
import useGetTrendSongs from "@/hooks/data/useGetTrendSongs";
import useGetSpotlight from "@/hooks/data/useGetSpotlight";
import useGetSongs from "@/hooks/data/useGetSongs";
import useGetRecommendations from "@/hooks/data/useGetRecommendations";
import useGetPublicPlaylists from "@/hooks/data/useGetPublicPlaylists";

interface HomeContentProps {
  initialData?: {
    trendSongs?: Song[];
    spotlightData?: Spotlight[];
    latestSongs?: Song[];
    publicPlaylists?: Playlist[];
  };
}

import TrendSection from "./sections/TrendSection";
import SpotlightSection from "./sections/SpotlightSection";
import LatestReleasesSection from "./sections/LatestSection";
import ForYouSection from "./sections/ForYouSection";
import PlaylistsSection from "./sections/PlaylistsSection";
import GenreSection from "./sections/GenreSection";

const HomeContent: React.FC<HomeContentProps> = ({ initialData }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<
    "all" | "month" | "week" | "day"
  >("all");

  const { trends: trendSongs, isLoading: trendLoading } = useGetTrendSongs(
    selectedPeriod,
    initialData?.trendSongs
  );

  const { spotlightData, isLoading: spotlightLoading } = useGetSpotlight(
    initialData?.spotlightData
  );

  const { songs, isLoading: songsLoading } = useGetSongs(
    initialData?.latestSongs
  );

  const { recommendations, isLoading: recommendationsLoading } =
    useGetRecommendations();

  const { playlists, isLoading: playlistsLoading } = useGetPublicPlaylists(
    initialData?.publicPlaylists
  );

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
