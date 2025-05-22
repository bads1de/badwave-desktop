import React from "react";
import { Spotlight } from "@/types";
import SpotlightBoard from "@/components/SpotlightBoard";

interface SpotlightSectionProps {
  spotlightData: Spotlight[];
}

/**
 * スポットライトセクションコンポーネント
 *
 * @param spotlightData - スポットライトデータ
 */
const SpotlightSection: React.FC<SpotlightSectionProps> = ({
  spotlightData,
}) => {
  return (
    <section>
      <h2 className="text-3xl font-bold text-white tracking-tight mb-4">
        Spotlight
      </h2>
      <p className="text-sm text-neutral-400 mb-6">
        Featured artists and songs
      </p>
      <SpotlightBoard spotlightData={spotlightData} />
    </section>
  );
};

export default React.memo(SpotlightSection);
