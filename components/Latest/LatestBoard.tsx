"use client";

import { useState, useCallback, memo } from "react";
import SongItem from "@/components/Song/SongItem";
import useOnPlay from "@/hooks/player/useOnPlay";
import { Song } from "@/types";
import usePlayer from "@/hooks/player/usePlayer";
import ScrollableContainer from "@/components/common/ScrollableContainer";
import { motion } from "framer-motion";

interface LatestBoardProps {
  songs: Song[];
}

const LatestBoard: React.FC<LatestBoardProps> = ({ songs }) => {
  const player = usePlayer();
  const onPlay = useOnPlay(songs);
  const [showArrows, setShowArrows] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  // メモ化された再生処理関数
  const handlePlay = useCallback(
    (id: string) => {
      onPlay(id);
      player.setId(id);
    },
    [onPlay, player]
  );

  if (songs.length === 0) {
    return (
      <p className="text-neutral-400 text-center">曲が見つかりませんでした</p>
    );
  }

  return (
    <div
      className="flex flex-col h-full"
      onMouseEnter={() => setShowArrows(true)}
      onMouseLeave={() => setShowArrows(false)}
    >
      <ScrollableContainer showArrows={showArrows}>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex space-x-4"
        >
          {songs.map((item) => (
            <motion.div
              key={item.id}
              variants={itemVariants}
              className="group relative transform transition duration-300 ease-in-out hover:scale-105 min-w-[200px] w-[200px]"
            >
              <SongItem onClick={(id) => handlePlay(id)} data={item} />
            </motion.div>
          ))}
        </motion.div>
      </ScrollableContainer>
    </div>
  );
};

// メモ化されたコンポーネントをエクスポート
export default memo(LatestBoard);
