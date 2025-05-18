"use client";

import { useState, memo, useCallback } from "react";
import { Song } from "@/types";
import { motion } from "framer-motion";
import useOnPlay from "@/hooks/player/useOnPlay";
import ScrollableContainer from "@/components/common/ScrollableContainer";
import SongItem from "@/components/Song/SongItem";

interface ForYouBoardProps {
  className?: string;
  recommendations: Song[];
}

const ForYouBoard: React.FC<ForYouBoardProps> = ({
  className = "",
  recommendations = [],
}) => {
  const [showArrows, setShowArrows] = useState(false);
  const onPlay = useOnPlay(recommendations);

  // クリックハンドラをメモ化
  const handlePlay = useCallback(
    (id: string) => {
      onPlay(id);
    },
    [onPlay]
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  if (recommendations.length === 0) {
    return (
      <p className="text-neutral-400 text-center">
        まだ推薦曲がありません。もっと曲を聴いてみましょう！
      </p>
    );
  }

  return (
    <div
      className={`${className}`}
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
          {recommendations.map((song) => (
            <motion.div
              key={song.id}
              variants={itemVariants}
              className="group relative transform transition duration-300 ease-in-out hover:scale-105 min-w-[200px] w-[200px]"
            >
              <SongItem onClick={handlePlay} data={song} />
            </motion.div>
          ))}
        </motion.div>
      </ScrollableContainer>
    </div>
  );
};

// 表示名を設定
ForYouBoard.displayName = "ForYouBoard";

// メモ化されたコンポーネントをエクスポート
export default memo(ForYouBoard);
