"use client";

import useOnPlay from "@/hooks/player/useOnPlay";
import { useUser } from "@/hooks/auth/useUser";
import { Song } from "@/types";
import React, { memo, useCallback } from "react";
import SongList from "@/components/Song/SongList";
import SongOptionsPopover from "@/components/Song/SongOptionsPopover";
import useGetSongsByGenre from "@/hooks/data/useGetSongsByGenre";

interface Props {
  genre: string;
}

const GenreContent: React.FC<Props> = memo(({ genre }) => {
  // クライアントサイドでデータを取得（オフライン対応付き）
  const { songs, isLoading } = useGetSongsByGenre(genre);
  const onPlay = useOnPlay(songs);
  const { user } = useUser();

  // 再生ハンドラをメモ化
  const handlePlay = useCallback(
    (id: string) => {
      onPlay(id);
    },
    [onPlay]
  );

  // ローディング中
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-theme-500"></div>
      </div>
    );
  }

  if (songs.length === 0) {
    return (
      <div className="flex flex-col gap-y-2 w-full px-6 text-neutral-400">
        <h1>該当の曲が見つかりませんでした</h1>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-y-2 w-full p-6">
      {songs.map((song: Song) => (
        <div key={song.id} className="flex items-center gap-x-4 w-full">
          <div className="flex-1 min-w-0">
            <SongList data={song} onClick={handlePlay} />
          </div>
          {user?.id && (
            <div className="flex items-center gap-x-2">
              <SongOptionsPopover song={song} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
});

// displayName を設定
GenreContent.displayName = "GenreContent";

export default GenreContent;
