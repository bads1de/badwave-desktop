"use client";

import { Song } from "@/types";
import useOnPlay from "@/hooks/player/useOnPlay";
import SongOptionsPopover from "@/components/Song/SongOptionsPopover";
import SongList from "@/components/Song/SongList";
import BulkDownloadButton from "@/components/downloads/BulkDownloadButton";
import { memo, useCallback } from "react";
import useGetLikedSongs from "@/hooks/data/useGetLikedSongs";
import { useSyncLikedSongs } from "@/hooks/sync/useSyncLikedSongs";
import { useUser } from "@/hooks/auth/useUser";

interface SongListContentProps {
  songs?: Song[];
  playlistId?: string;
  playlistUserId?: string;
  showDownloadButton?: boolean;
}

const SongListContent: React.FC<SongListContentProps> = memo(
  ({
    songs: propSongs,
    playlistId,
    playlistUserId,
    showDownloadButton = true,
  }) => {
    const { user } = useUser();

    // バックグラウンド同期を開始（propSongsがない場合＝お気に入りページ）
    // autoSync: true により、マウント時およびオンライン復帰時に自動同期
    useSyncLikedSongs({ autoSync: !propSongs });

    // クライアントサイドでデータを取得（ローカルDBから読み込み）
    const { likedSongs, isLoading } = useGetLikedSongs(
      propSongs ? undefined : user?.id
    );

    const songs = propSongs ?? likedSongs;
    const onPlay = useOnPlay(songs);
    const displayedSongs = playlistId ? [...songs].reverse() : songs;

    // 再生ハンドラをメモ化
    const handlePlay = useCallback(
      (id: string) => {
        onPlay(id);
      },
      [onPlay]
    );

    // ローディング中（propsでsongsが渡された場合はスキップ）
    if (!propSongs && isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-theme-500"></div>
        </div>
      );
    }

    if (songs.length === 0) {
      return (
        <div className=" flex flex-col gap-y-2 w-full px-6 text-neutral-400">
          楽曲が見つかりませんでした
        </div>
      );
    }

    return (
      <div className="flex flex-col w-full px-4 sm:px-6 pb-24">
        {/* ツールバー / アクションエリア */}
        {showDownloadButton && songs.length > 0 && (
          <div className="flex items-center justify-between py-6 px-2 sticky top-0 z-20 bg-transparent backdrop-blur-sm -mx-2 mb-2">
            <div className="flex items-center gap-x-3">
              <span className="text-neutral-400 text-sm font-bold tracking-widest uppercase opacity-60">
                {songs.length} Tracks
              </span>
            </div>
            <BulkDownloadButton
              songs={songs}
              downloadLabel={
                playlistId ? "Download Playlist" : "Download Liked"
              }
              deleteLabel={playlistId ? "Clear Downloads" : "Clear Downloads"}
            />
          </div>
        )}

        <div className="grid grid-cols-1 gap-y-3">
          {displayedSongs.map((song: Song) => (
            <div
              key={song.id}
              className="flex items-center gap-x-4 w-full animate-fade-in"
              style={{
                animationDelay: `${displayedSongs.indexOf(song) * 50}ms`,
              }}
            >
              <div className="flex-1 min-w-0">
                <SongList data={song} onClick={handlePlay} />
              </div>
              <SongOptionsPopover
                song={song}
                playlistId={playlistId}
                playlistUserId={playlistUserId}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }
);

SongListContent.displayName = "SongListContent";

export default SongListContent;
