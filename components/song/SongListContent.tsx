"use client";

import { Song } from "@/types";
import useOnPlay from "@/hooks/player/useOnPlay";
import SongOptionsPopover from "@/components/song/SongOptionsPopover";
import SongList from "@/components/song/SongList";
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

    // バックグラウンド同期を開始（propSongsがない場合＝お気に入りページ等）
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
        <div className="flex flex-col items-center justify-center py-24 gap-4 font-mono">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-2 border-theme-500/10 rounded-none animate-ping" />
            <div className="absolute inset-2 border-2 border-theme-500/30 rounded-none animate-spin" />
            <div className="absolute inset-4 border-2 border-theme-500 rounded-none animate-pulse" />
          </div>
          <p className="text-theme-500 text-[10px] tracking-[0.3em] uppercase animate-pulse">
            // SYNCING_TRACK_METADATA...
          </p>
        </div>
      );
    }

    if (songs.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-theme-500/40 font-mono">
          <div className="text-xl uppercase tracking-[0.4em]">[ VOID_DETECTED ]</div>
          <p className="text-[10px] uppercase tracking-widest text-center max-w-xs">
            // NO_AUDIO_STREAMS_FOUND_IN_THIS_SECTOR.
          </p>
        </div>
      );
    }

    return (
      <div className="flex flex-col w-full px-4 sm:px-8 pb-32">
        {/* ツールバー / アクションエリア */}
        {showDownloadButton && (
          <div className="flex items-center justify-between py-6 px-4 sticky top-0 z-20 bg-[#0a0a0f]/60 backdrop-blur-xl border-y border-theme-500/10 -mx-4 mb-8 font-mono">
            <div className="flex flex-col gap-1">
              <span className="text-theme-300 text-xs font-black tracking-[0.2em] uppercase">
                {songs.length.toString().padStart(2, '0')}_TRACKS_FOUND
              </span>
              <div className="h-0.5 w-12 bg-theme-500 shadow-[0_0_8px_rgba(var(--theme-500),0.8)]" />
            </div>
            <BulkDownloadButton
              songs={songs}
              downloadLabel={
                playlistId ? "DOWNLOAD_ARCHIVE" : "DOWNLOAD_COLLECTION"
              }
              deleteLabel="CLEAR_LOCAL_CACHE"
            />
          </div>
        )}

        <div className="grid grid-cols-1 gap-y-3">
          {displayedSongs.map((song: Song, index: number) => (
            <div
              key={song.id}
              className="flex items-center gap-x-4 w-full animate-fade-in"
              style={{
                animationDelay: `${index * 50}ms`,
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

