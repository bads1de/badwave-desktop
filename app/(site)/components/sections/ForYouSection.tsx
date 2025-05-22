import React from "react";
import { Song } from "@/types";
import ForYouBoard from "@/components/ForYou/ForYouBoard";

interface ForYouSectionProps {
  recommendations: Song[];
}

/**
 * あなたへのおすすめセクションコンポーネント
 *
 * @param recommendations - おすすめ曲データ
 */
const ForYouSection: React.FC<ForYouSectionProps> = ({ recommendations }) => {
  return (
    <section>
      <h2 className="text-3xl font-bold text-white tracking-tight mb-4">
        For You
      </h2>
      <p className="text-sm text-neutral-400 mb-6">
        Personalized recommendations based on your taste
      </p>
      <ForYouBoard recommendations={recommendations} />
    </section>
  );
};

export default React.memo(ForYouSection);
