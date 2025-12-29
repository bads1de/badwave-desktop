import React from "react";
import GenreBoard from "@/components/Genre/GenreBoard";

/**
 * ジャンルセクションコンポーネント
 */
const GenreSection: React.FC = () => {
  return (
    <section>
      <h2 className="text-3xl font-bold text-white tracking-tight mb-4">
        Browse by Genre
      </h2>
      <p className="text-sm text-neutral-400 mb-6">
        Discover music by genre
      </p>
      <GenreBoard />
    </section>
  );
};

export default React.memo(GenreSection);
