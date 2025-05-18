"use client";

import { useState, memo } from "react";
import GenreCard from "./GenreCard";
import ScrollableContainer from "@/components/common/ScrollableContainer";

export interface GenreData {
  id: number;
  name: string;
  color: string;
}

interface GenreBoardProps {
  className?: string;
}

// ジャンルデータは変更されないのでコンポーネント外で定義
const genreData: GenreData[] = [
  { id: 1, name: "Retro Wave", color: "bg-purple-500" },
  { id: 2, name: "Electro House", color: "bg-blue-500" },
  { id: 3, name: "Nu Disco", color: "bg-red-500" },
  { id: 4, name: "City Pop", color: "bg-green-500" },
  { id: 5, name: "Tropical House", color: "bg-yellow-500" },
  { id: 6, name: "Vapor Wave", color: "bg-indigo-500" },
  { id: 7, name: "r&b", color: "bg-pink-500" },
  { id: 8, name: "Chill House", color: "bg-orange-500" },
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
          <GenreCard key={genre.id} genre={genre.name} color={genre.color} />
        ))}
      </ScrollableContainer>
    </div>
  );
});

// 表示名を設定
GenreBoard.displayName = "GenreBoard";

export default GenreBoard;
