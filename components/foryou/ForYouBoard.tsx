"use client";

import { memo, useCallback } from "react";
import { Song } from "@/types";
import useOnPlay from "@/hooks/player/useOnPlay";
import SongScrollBoard from "@/components/common/SongScrollBoard";

interface ForYouBoardProps {
  className?: string;
  recommendations: Song[];
}

const EMPTY_STATE = (
  <div className="py-10 border border-dashed border-theme-500/20 bg-theme-500/5 text-center px-4 font-mono rounded-xl">
    <p className="text-theme-500/60 uppercase tracking-[0.2em] text-xs">
      [ ! ] ALGORITHM_TRAINING_IN_PROGRESS
    </p>
    <p className="text-[10px] text-theme-500/40 mt-2 uppercase tracking-widest">
      // NEED_MORE_STREAM_DATA_FOR_PERSONALIZATION
    </p>
  </div>
);

const ForYouBoard: React.FC<ForYouBoardProps> = ({
  className = "",
  recommendations = [],
}) => {
  const onPlay = useOnPlay(recommendations);

  const handlePlay = useCallback(
    (id: string) => {
      onPlay(id);
    },
    [onPlay],
  );

  return (
    <SongScrollBoard
      songs={recommendations}
      onPlaySong={handlePlay}
      className={className}
      emptyState={EMPTY_STATE}
    />
  );
};

ForYouBoard.displayName = "ForYouBoard";

export default memo(ForYouBoard);
