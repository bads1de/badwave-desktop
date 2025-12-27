"use client";

import { PulseLoader } from "react-spinners";
import Box from "@/components/common/Box";
import { motion } from "framer-motion";

const Loading = () => {
  return (
    <Box className="h-full flex items-center justify-center bg-gradient-to-br from-neutral-900/80 via-theme-900/20 to-neutral-900/80">
      <div className="relative">
        {/* バックグラウンドのblur */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-theme-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-theme-900/10 rounded-full blur-3xl" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 flex flex-col items-center gap-4 p-8"
        >
          {/* ローディングアニメーション */}
          <PulseLoader
            color="var(--primary-color)"
            size={15}
            speedMultiplier={0.8}
          />
          {/* ローディングテキスト */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ delay: 0.2 }}
            className="text-sm text-neutral-400"
          >
            Loading...
          </motion.p>
        </motion.div>
      </div>
    </Box>
  );
};

export default Loading;
