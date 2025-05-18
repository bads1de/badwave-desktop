import React from "react";
import { Song } from "@/types";
import LatestBoard from "@/components/Latest/LatestBoard";

interface LatestSectionProps {
  songs: Song[];
}

/**
 * 最新リリースセクションコンポーネント
 *
 * @param songs - 曲データ
 */
const LatestSection: React.FC<LatestSectionProps> = ({ songs }) => {
  return (
    <section>
      <h2 className="text-3xl font-bold text-white tracking-tight mb-4">
        Latest Releases
      </h2>
      <p className="text-sm text-neutral-400 mb-6">
        Fresh new music just for you
      </p>
      <LatestBoard songs={songs} />
    </section>
  );
};

export default React.memo(LatestSection);
