"use client";

import { useState, memo } from "react";
import GenreCard from "./GenreCard";
import ScrollableContainer from "@/components/common/ScrollableContainer";

export interface GenreData {
  id: number;
  name: string;
}

interface GenreBoardProps {
  className?: string;
}

// ジャンルデータは変更されないのでコンポーネント外で定義
const genreData: GenreData[] = [
  { id: 1, name: "Retro Wave" },
  { id: 2, name: "Electro House" },
  { id: 3, name: "Nu Disco" },
  { id: 4, name: "City Pop" },
  { id: 5, name: "Tropical House" },
  { id: 6, name: "Vapor Wave" },
  { id: 7, name: "r&b" },
  { id: 8, name: "Chill House" },
];

const GenreBoard: React.FC<GenreBoardProps> = memo(({ className = "" }) => {
  const [showArrows, setShowArrows] = useState(false);

  return (
    <div
      className={`${className}`}
      onMouseEnter={() => setShowArrows(true)}
      onMouseLeave={() => setShowArrows(false)}
    >
      <ScrollableContainer showArrows={showArrows}>
        {genreData.map((genre) => (
          <GenreCard key={genre.id} genre={genre.name} />
        ))}
      </ScrollableContainer>
    </div>
  );
});

// 表示名を設定
GenreBoard.displayName = "GenreBoard";

export default GenreBoard;
