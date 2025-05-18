"use client";

import { Song } from "@/types";
import useOnPlay from "@/hooks/player/useOnPlay";
import SongOptionsPopover from "@/components/Song/SongOptionsPopover";
import SongList from "@/components/Song/SongList";
import { memo, useCallback } from "react";

interface LikedContentProps {
  songs: Song[];
  playlistId?: string;
  playlistUserId?: string;
}

const LikedContent: React.FC<LikedContentProps> = memo(
  ({ songs, playlistId, playlistUserId }) => {
    const onPlay = useOnPlay(songs);
    const displayedSongs = playlistId ? [...songs].reverse() : songs;

    // 再生ハンドラをメモ化
    const handlePlay = useCallback(
      (id: string) => {
        onPlay(id);
      },
      [onPlay]
    );

    if (songs.length === 0) {
      return (
        <div className=" flex flex-col gap-y-2 w-full px-6 text-neutral-400">
          楽曲が見つかりませんでした
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-y-2 w-full p-6">
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
