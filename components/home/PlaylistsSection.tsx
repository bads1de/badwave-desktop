import React from "react";
import { Playlist } from "@/types";
import PublicPlaylistBoard from "@/components/playlist/PublicPlaylistBoard";

interface PlaylistsSectionProps {
  playlists: Playlist[];
}

/**
 * おすすめプレイリストセクションコンポーネント
 *
 * @param playlists - おすすめプレイリスト一覧
 */
const PlaylistsSection: React.FC<PlaylistsSectionProps> = ({ playlists }) => {
  return (
    <section className="relative">
      <div className="flex items-center gap-x-4 mb-6 group/header">
        <div className="h-10 w-1 bg-theme-500 shadow-[0_0_15px_rgba(var(--theme-500),0.8)] animate-pulse" />
        <div>
          <h2 className="text-3xl font-bold text-white tracking-[0.2em] uppercase font-mono drop-shadow-[0_0_8px_rgba(var(--theme-500),0.5)]">
            FEATURED_PLAYLISTS
          </h2>
          <p className="text-[10px] text-theme-500/60 mt-1 font-mono tracking-widest uppercase">
            // COMMUNITY_DATA_SYNC_SUCCESS
          </p>
        </div>
      </div>
      <div className="relative">
        <PublicPlaylistBoard playlists={playlists} />
        {/* HUDのグラデーション */}
        <div className="absolute top-0 right-0 w-32 h-px bg-gradient-to-l from-theme-500/30 to-transparent" />
        <div className="absolute bottom-0 left-0 w-32 h-px bg-gradient-to-r from-theme-500/30 to-transparent" />
      </div>
    </section>
  );
};

export default React.memo(PlaylistsSection);
