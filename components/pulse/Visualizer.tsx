"use client";

import { motion } from "framer-motion";
import React from "react";

const Visualizer = React.memo(() => {
  return (
    <div className="w-64 h-32 border-2 border-cyan-500/50 bg-black/40 backdrop-blur-sm p-4 relative overflow-hidden rounded-lg shadow-[0_0_15px_rgba(0,255,255,0.3)]">
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(0deg, transparent 24%, rgba(0, 255, 255, .3) 25%, rgba(0, 255, 255, .3) 26%, transparent 27%, transparent 74%, rgba(0, 255, 255, .3) 75%, rgba(0, 255, 255, .3) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(0, 255, 255, .3) 25%, rgba(0, 255, 255, .3) 26%, transparent 27%, transparent 74%, rgba(0, 255, 255, .3) 75%, rgba(0, 255, 255, .3) 76%, transparent 77%, transparent)",
          backgroundSize: "30px 30px",
        }}
      />

      <div className="flex items-end justify-between h-full gap-1 pt-4 pb-1">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="w-full bg-gradient-to-t from-cyan-600 via-cyan-400 to-white rounded-t-sm opacity-80"
            animate={{
              height: ["20%", `${Math.random() * 80 + 20}%`, "20%"],
            }}
            transition={{
              duration: 0.5 + Math.random() * 0.5,
              repeat: Infinity,
              ease: "easeInOut",
              repeatType: "mirror",
            }}
            style={{
              boxShadow: "0 0 5px cyan",
            }}
          />
        ))}
      </div>
    </div>
  );
});

Visualizer.displayName = "Visualizer";

export default Visualizer;
