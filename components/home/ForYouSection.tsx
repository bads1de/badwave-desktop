import React from "react";
import { Song } from "@/types";
import ForYouBoard from "@/components/foryou/ForYouBoard";

interface ForYouSectionProps {
  recommendations: Song[];
}

/**
 * 縺ゅ↑縺溘∈縺ｮ縺翫☆縺吶ａ繧ｻ繧ｯ繧ｷ繝ｧ繝ｳ繧ｳ繝ｳ繝昴・繝阪Φ繝・
 *
 * @param recommendations - 縺翫☆縺吶ａ譖ｲ繝・・繧ｿ
 */
const ForYouSection: React.FC<ForYouSectionProps> = ({ recommendations }) => {
  return (
    <section className="relative">
      <div className="flex items-center gap-x-4 mb-6 group/header">
        <div className="h-10 w-1 bg-theme-500 shadow-[0_0_15px_rgba(var(--theme-500),0.8)] animate-pulse" />
        <div>
          <h2 className="text-3xl font-bold text-white tracking-[0.2em] uppercase font-mono drop-shadow-[0_0_8px_rgba(var(--theme-500),0.5)]">
            FOR_YOU_OPERATOR
          </h2>
          <p className="text-[10px] text-theme-500/60 mt-1 font-mono tracking-widest uppercase">
            // ALGORITHM_RECOMMENDATIONS_READY
          </p>
        </div>
      </div>
      <div className="relative p-6 bg-[#0a0a0f]/40 border border-theme-500/10 rounded-xl shadow-[inset_0_0_20px_rgba(var(--theme-500),0.05)]">
        {/* HUD陬・｣ｾ繧ｳ繝ｼ繝翫・ */}
        <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-theme-500/20 pointer-events-none rounded-tr-xl" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-theme-500/20 pointer-events-none rounded-bl-xl" />

        <ForYouBoard recommendations={recommendations} />
      </div>
    </section>
  );
};

export default React.memo(ForYouSection);

