"use client";

import { useState, useEffect } from "react";

// データ取得フック
import useGetRecommendations from "@/hooks/data/useGetRecommendations";
import useGetTrendSongs from "@/hooks/data/useGetTrendSongs";
import useGetSpotlight from "@/hooks/data/useGetSpotlight";
import useGetSongs from "@/hooks/data/useGetSongs";
import useGetPublicPlaylists from "@/hooks/data/useGetPublicPlaylists";

// 背景同期フック
import { useSyncTrends } from "@/hooks/sync/useSyncTrends";
import { useSyncSpotlight } from "@/hooks/sync/useSyncSpotlight";
import { useSyncLatestSongs } from "@/hooks/sync/useSyncLatestSongs";
import { useSyncRecommendations } from "@/hooks/sync/useSyncRecommendations";
import { useSyncPublicPlaylists } from "@/hooks/sync/useSyncPublicPlaylists";

// セクションコンポーネント
import TrendSection from "@/components/Home/TrendSection";
import SpotlightSection from "@/components/Home/SpotlightSection";
import LatestReleasesSection from "@/components/Home/LatestSection";
import ForYouSection from "@/components/Home/ForYouSection";
import PlaylistsSection from "@/components/Home/PlaylistsSection";
import GenreSection from "@/components/Home/GenreSection";
import SectionSkeleton from "@/components/Home/SectionSkeleton";

/**
 * ホームページ
 *
 * 全てのデータをクライアントサイドフックで取得します。
 * TanStack Query と Electron Store による永続化キャッシュにより、
 * オフライン時や起動時にローカルデータを即座に表示します。
 */
export default function Home() {
  const [selectedPeriod, setSelectedPeriod] = useState<
    "all" | "month" | "week" | "day"
  >("all");

  // Hydrationエラーを防ぐため、マウント状態を管理
  // 初期レンダリング（サーバー＆クライアントハイドレーション）時はスケルトンを表示し、
  // マウント後にデータがあれば表示に切り替えることで不一致を防ぐ
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 各セクションのデータをクライアントサイドでフェッチ（キャッシュ優先）
  const { trends, isLoading: trendsLoading } = useGetTrendSongs(selectedPeriod);
  const { spotlightData, isLoading: spotlightLoading } = useGetSpotlight();
  const { songs: latestSongs, isLoading: latestLoading } = useGetSongs();
  const { playlists: publicPlaylists, isLoading: playlistsLoading } =
    useGetPublicPlaylists();
  const { recommendations, isLoading: recommendationsLoading } =
    useGetRecommendations();

  // 背景同期の実行 (Electron環境下でのみ動作)
  useSyncTrends(selectedPeriod);
  useSyncSpotlight();
  useSyncLatestSongs();
  useSyncRecommendations();
  useSyncPublicPlaylists();

  return (
    <div className="flex bg-[#0d0d0d] h-full overflow-hidden">
      <div className="w-full h-full overflow-y-auto custom-scrollbar">
        <main className="px-6 py-8 pb-8 space-y-8">
          {/* トレンドボードセクション */}
          {!isMounted || (trendsLoading && trends.length === 0) ? (
            <SectionSkeleton title="Trends" type="trend" />
          ) : (
            <TrendSection
              selectedPeriod={selectedPeriod}
              onPeriodChange={setSelectedPeriod}
              songs={trends}
            />
          )}

          {/* スポットライトセクション */}
          {!isMounted || (spotlightLoading && spotlightData.length === 0) ? (
            <SectionSkeleton title="Spotlight" type="spotlight" />
          ) : (
            <SpotlightSection spotlightData={spotlightData} />
          )}

          {/* 最新曲セクション */}
          {!isMounted || (latestLoading && latestSongs.length === 0) ? (
            <SectionSkeleton title="Latest Releases" type="latest" />
          ) : (
            <LatestReleasesSection songs={latestSongs} />
          )}

          {/* あなたへのおすすめセクション */}
          {!isMounted ||
          (recommendationsLoading && recommendations.length === 0) ? (
            <SectionSkeleton
              title="For You"
              description="Personalized recommendations based on your taste"
              type="forYou"
            />
          ) : (
            <ForYouSection recommendations={recommendations} />
          )}

          {/* パブリックプレイリストセクション */}
          {!isMounted || (playlistsLoading && publicPlaylists.length === 0) ? (
            <SectionSkeleton title="Public Playlists" type="playlists" />
          ) : (
            <PlaylistsSection playlists={publicPlaylists} />
          )}

          {/* ジャンルボードセクション - 静的データ */}
          <GenreSection />
        </main>
      </div>
    </div>
  );
}
