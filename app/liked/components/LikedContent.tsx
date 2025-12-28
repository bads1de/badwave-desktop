"use client";

import { Song } from "@/types";
import useOnPlay from "@/hooks/player/useOnPlay";
import SongOptionsPopover from "@/components/Song/SongOptionsPopover";
import SongList from "@/components/Song/SongList";
import BulkDownloadButton from "@/components/downloads/BulkDownloadButton";
import { memo, useCallback } from "react";
import useGetLikedSongs from "@/hooks/data/useGetLikedSongs";
import { useUser } from "@/hooks/auth/useUser";

interface LikedContentProps {
  songs?: Song[];
  playlistId?: string;
  playlistUserId?: string;
  showDownloadButton?: boolean;
}

const LikedContent: React.FC<LikedContentProps> = memo(
  ({
    songs: propSongs,
    playlistId,
    playlistUserId,
    showDownloadButton = true,
  }) => {
    const { user } = useUser();
    // クライアントサイドでデータを取得（オフライン対応付き）
    // propsでsongsが渡された場合はそれを使用（プレイリストページからの利用）
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
      <div className="flex flex-col gap-y-2 w-full p-6">
        {/* 一括ダウンロードボタン */}
        {showDownloadButton && songs.length > 0 && (
          <div className="flex justify-end mb-4">
            <BulkDownloadButton
              songs={songs}
              downloadLabel={
                playlistId
                  ? "プレイリストをダウンロード"
                  : "お気に入りをダウンロード"
              }
              deleteLabel={
                playlistId
                  ? "プレイリストのダウンロードを削除"
                  : "お気に入りのダウンロードを削除"
              }
            />
          </div>
        )}

        {displayedSongs.map((song: Song) => (
          <div key={song.id} className="flex items-center gap-x-4 w-full">
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
    );
  }
);

// displayName を設定
LikedContent.displayName = "LikedContent";

export default LikedContent;
