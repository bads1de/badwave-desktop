"use client";

import React from "react";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";
import { WifiOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * ネットワークがオフラインの時に表示されるインジケーター
 * ガラスモーフィズムとアニメーションを使用してプレミアムな質感を演出
 */
const OfflineIndicator: React.FC = () => {
  const { isOnline } = useNetworkStatus();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999]"
        >
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-full 
                        bg-yellow-500/10 border border-yellow-500/20 
                        backdrop-blur-md shadow-lg shadow-yellow-500/5 
                        text-yellow-500 text-sm font-medium"
          >
            <WifiOff size={16} className="animate-pulse" />
            <span>オフラインモード</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineIndicator;
