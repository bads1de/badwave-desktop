"use client";

import PlaylistHeader from "./PlaylistHeader";
import LikedContent from "@/app/liked/components/LikedContent";
import useGetPlaylist from "@/hooks/data/useGetPlaylist";
import useGetPlaylistSongs from "@/hooks/data/useGetPlaylistSongs";
import { memo } from "react";
import { notFound } from "next/navigation";

interface PlaylistPageContentProps {
  playlistId: string;
}

const PlaylistPageContent: React.FC<PlaylistPageContentProps> = memo(
  ({ playlistId }) => {
    // クライアントサイドでデータを取得（オフライン対応付き）
    const { playlist, isLoading: playlistLoading } = useGetPlaylist(playlistId);
    const { songs, isLoading: songsLoading } = useGetPlaylistSongs(playlistId);

    // ローディング中
    if (playlistLoading || songsLoading) {
      return (
        <div className="bg-neutral-900 h-full w-full overflow-hidden overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-theme-500"></div>
          </div>
        </div>
      );
    }

    // プレイリストが見つからない場合
    if (!playlist) {
      return notFound();
    }

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
