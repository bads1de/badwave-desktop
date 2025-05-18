"use client";

import PlaylistHeader from "./PlaylistHeader";
import LikedContent from "@/app/liked/components/LikedContent";
import { Playlist, Song } from "@/types";
import { memo } from "react";

interface PlaylistPageContentProps {
  playlist: Playlist;
  songs: Song[];
}

const PlaylistPageContent: React.FC<PlaylistPageContentProps> = memo(
  ({ playlist, songs }) => {
    return (
      <div className="bg-neutral-900 h-full w-full overflow-hidden overflow-y-auto custom-scrollbar">
        <PlaylistHeader
          playlistId={playlist.id}
          playlistTitle={playlist.title}
          imageUrl={playlist.image_path || "/images/playlist.png"}
          songCount={songs.length}
          isPublic={playlist.is_public}
          createdAt={playlist.created_at}
          userId={playlist.user_id}
        />
        <div className="max-w-7xl mx-auto px-6 py-6">
          {songs.length ? (
            <LikedContent
              songs={songs}
              playlistId={playlist.id}
              playlistUserId={playlist.user_id}
            />
          ) : (
            <div className="flex flex-col gap-y-2 w-full px-6 text-neutral-400">
              <h1>プレイリストに曲が追加されていません</h1>
            </div>
          )}
        </div>
      </div>
    );
  }
);

// displayName を設定
PlaylistPageContent.displayName = "PlaylistPageContent";

export default PlaylistPageContent;
