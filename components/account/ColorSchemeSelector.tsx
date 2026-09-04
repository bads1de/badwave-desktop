"use client";

import { motion } from "framer-motion";
import { HiCheck } from "react-icons/hi";
import { colorSchemes } from "@/constants/colorSchemes";
import useColorSchemeStore from "@/hooks/stores/useColorSchemeStore";

export const ColorSchemeSelector = () => {
  const { colorSchemeId, setColorScheme } = useColorSchemeStore();

  return (
    <div className="relative bg-[#0a0a0f] border border-theme-500/10 p-8 rounded-none overflow-hidden group shadow-[0_0_30px_rgba(0,0,0,0.5)]">
      {/* HUD装飾 */}
      <div className="absolute top-0 right-0 w-6 h-6 border-t border-r border-theme-500/40 group-hover:border-theme-500 transition-all" />
      <div className="absolute bottom-0 left-0 w-6 h-6 border-b border-l border-theme-500/40 group-hover:border-theme-500 transition-all" />

      <div className="relative">
        <div className="mb-8 font-mono">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1 h-1 bg-theme-500" />
            <h3 className="text-[10px] font-black text-theme-500 uppercase tracking-[0.4em]">INTERFACE_THEME_SELECT</h3>
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-widest">カラースキーム設定</h2>
          <p className="text-[9px] text-theme-500/40 uppercase tracking-widest mt-1">
            // OVERRIDE_SYSTEM_VISUAL_REPRESENTATION_MODULE
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {colorSchemes.map((scheme) => {
            const isSelected = colorSchemeId === scheme.id;
            return (
              <motion.button
                key={scheme.id}
                onClick={() => setColorScheme(scheme.id)}
                className={`
                  relative p-4 text-left transition-all duration-300 rounded-none border group/item
                  ${
                    isSelected
                      ? "border-theme-500 bg-theme-500/10 shadow-[0_0_15px_rgba(var(--theme-500),0.2)]"
                      : "border-theme-500/10 bg-black/40 hover:bg-theme-500/5 hover:border-theme-500/40"
                  }
                `}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div
                  className="w-full h-12 rounded-none mb-4 relative overflow-hidden saturate-[1.5]"
                  style={{ background: scheme.previewGradient }}
                >
                  <div className="absolute inset-0 opacity-20 bg-[length:100%_4px] bg-[linear-gradient(rgba(255,255,255,0)_50%,rgba(0,0,0,0.5)_50%)]" />
                </div>
                
                <div className="flex items-center justify-between font-mono">
                  <div className="min-w-0">
                    <h4 className={`font-black text-xs uppercase tracking-widest truncate ${isSelected ? "text-theme-400" : "text-white"}`}>
                      {scheme.name}
                    </h4>
                    <p className="text-[8px] text-theme-500/40 mt-1 uppercase tracking-tighter truncate">
                      // {scheme.description}
                    </p>
                  </div>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center justify-center w-5 h-5 bg-theme-500 text-black shadow-[0_0_10px_rgba(var(--theme-500),0.5)]"
                    >
                      <HiCheck className="w-4 h-4" />
                    </motion.div>
                  )}
                </div>
                
                {/* Decoration */}
                <div className={`absolute top-0 right-0 w-2 h-2 border-t border-r transition-colors ${isSelected ? "border-theme-500" : "border-transparent"}`} />
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
