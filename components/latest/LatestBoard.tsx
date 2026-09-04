"use client";

import { useCallback, memo } from "react";
import useOnPlay from "@/hooks/player/useOnPlay";
import { Song } from "@/types";
import usePlayer from "@/hooks/player/usePlayer";
import SongScrollBoard from "@/components/common/SongScrollBoard";

interface LatestBoardProps {
  songs: Song[];
}

const LatestBoard: React.FC<LatestBoardProps> = ({ songs }) => {
  const player = usePlayer();
  const onPlay = useOnPlay(songs);

  const handlePlay = useCallback(
    (id: string) => {
      onPlay(id);
      player.setId(id);
    },
    [onPlay, player],
  );

  return <SongScrollBoard songs={songs} onPlaySong={handlePlay} />;
};

export default memo(LatestBoard);
