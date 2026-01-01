import React from "react";
import Link from "next/link";
import { Song } from "@/types";
import LatestBoard from "@/components/Latest/LatestBoard";
import { ChevronRight } from "lucide-react";

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
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">
            Latest Releases
          </h2>
          <p className="text-sm text-neutral-400 mt-2">
            Fresh new music just for you
          </p>
        </div>
        <Link
          href="/songs/all"
          className="flex items-center gap-1 text-sm text-neutral-400 hover:text-white transition-colors group"
        >
          全てを表示
          <ChevronRight
            size={16}
            className="group-hover:translate-x-0.5 transition-transform"
          />
        </Link>
      </div>
      <LatestBoard songs={songs} />
    </section>
  );
};

export default React.memo(LatestSection);
