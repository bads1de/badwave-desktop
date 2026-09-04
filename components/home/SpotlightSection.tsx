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
    <section className="relative">
      <div className="flex items-center gap-x-4 mb-6 group/header">
        <div className="h-10 w-1 bg-theme-500 shadow-[0_0_15px_rgba(var(--theme-500),0.8)] animate-pulse" />
        <div>
          <h2 className="text-3xl font-bold text-white tracking-[0.2em] uppercase font-mono drop-shadow-[0_0_8px_rgba(var(--theme-500),0.5)]">
            SPOTLIGHT_SCAN
          </h2>
          <p className="text-[10px] text-theme-500/60 mt-1 font-mono tracking-widest uppercase">
            // PRIORITY_ASSET_HIGHLIGHT_v2.0
          </p>
        </div>
      </div>
      <div className="relative p-6 bg-[#0a0a0f]/60 border border-theme-500/10 rounded-xl overflow-hidden group">
         {/* 装飾用HUDライン */}
         <div className="absolute top-0 right-0 w-32 h-32 border-t border-r border-theme-500/10 group-hover:border-theme-500/30 transition-colors pointer-events-none" />
         
         <SpotlightBoard spotlightData={spotlightData} />
      </div>
    </section>
  );
};

export default React.memo(SpotlightSection);
