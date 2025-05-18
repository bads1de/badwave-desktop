import React from "react";
import { Playlist } from "@/types";
import PublicPlaylistBoard from "@/components/Playlist/PublicPlaylistBoard";

interface PlaylistsSectionProps {
  playlists: Playlist[];
}

/**
 * プレイリストセクションコンポーネント
 * 
 * @param playlists - プレイリストデータ
 */
const PlaylistsSection: React.FC<PlaylistsSectionProps> = ({ 
  playlists 
}) => {
  return (
    <section>
      <h2 className="text-3xl font-bold text-white tracking-tight mb-4">
        Featured Playlists
      </h2>
      <p className="text-sm text-neutral-400 mb-6">
        Explore playlists shared by the community
      </p>
      <PublicPlaylistBoard playlists={playlists} />
    </section>
  );
};

export default React.memo(PlaylistsSection);
