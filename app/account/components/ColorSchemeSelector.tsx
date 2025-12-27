"use client";

import { colorSchemes } from "@/constants/colorSchemes";
import useColorSchemeStore from "@/hooks/stores/useColorSchemeStore";
import { motion } from "framer-motion";
import { HiCheck } from "react-icons/hi";

const ColorSchemeSelector = () => {
  const { colorSchemeId, setColorScheme } = useColorSchemeStore();

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-neutral-900/80 via-neutral-800/20 to-neutral-900/80 backdrop-blur-xl border border-white/[0.05] shadow-lg rounded-2xl p-8">
      {/* 背景装飾 */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-[var(--accent-from)]/10 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-[var(--accent-to)]/10 rounded-full blur-3xl"></div>

      <div className="relative">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-white mb-2">カラースキーム</h3>
          <p className="text-sm text-neutral-400">
            アプリ全体の配色を変更します
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {colorSchemes.map((scheme) => {
            const isSelected = colorSchemeId === scheme.id;

            return (
              <motion.button
                key={scheme.id}
                onClick={() => setColorScheme(scheme.id)}
                className={`
                  relative overflow-hidden rounded-xl p-4 text-left transition-all duration-300
                  ${
                    isSelected
                      ? "ring-2 ring-white/50 bg-white/10"
                      : "bg-neutral-800/50 hover:bg-neutral-700/50 border border-white/5"
                  }
                `}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* カラープレビュー */}
                <div
                  className="w-full h-16 rounded-lg mb-3 shadow-inner"
                  style={{
                    background: scheme.previewGradient,
                  }}
                />

                {/* スキーム名 */}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-white text-sm">
                      {scheme.name}
                    </h4>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {scheme.description}
                    </p>
                  </div>

                  {/* 選択インジケーター */}
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center justify-center w-6 h-6 rounded-full bg-white"
                    >
                      <HiCheck className="w-4 h-4 text-neutral-900" />
                    </motion.div>
                  )}
                </div>

                {/* ホバーエフェクト */}
                <div
                  className="absolute inset-0 opacity-0 hover:opacity-10 transition-opacity duration-300 pointer-events-none"
                  style={{
                    background: scheme.previewGradient,
                  }}
                />
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ColorSchemeSelector;
