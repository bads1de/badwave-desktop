"use client";

import { motion } from "framer-motion";

interface CassetteTapeProps {
  isPlaying: boolean;
}

const CassetteTape: React.FC<CassetteTapeProps> = ({ isPlaying }) => {
  return (
    <div className="relative w-[300px] h-[190px] md:w-[400px] md:h-[250px] bg-[#e0e0e0] rounded-xl shadow-xl flex items-center justify-center overflow-hidden border-2 border-neutral-400 select-none">
      <div className="absolute inset-0 bg-neutral-200 opacity-50 pointer-events-none mix-blend-multiply" />
      <div className="absolute top-2 left-2 w-3 h-3 bg-neutral-400 rounded-full flex items-center justify-center">
        <div className="w-1.5 h-0.5 bg-neutral-600 rotate-45" />
        <div className="absolute w-1.5 h-0.5 bg-neutral-600 -rotate-45" />
      </div>
      <div className="absolute top-2 right-2 w-3 h-3 bg-neutral-400 rounded-full flex items-center justify-center">
        <div className="w-1.5 h-0.5 bg-neutral-600 rotate-45" />
        <div className="absolute w-1.5 h-0.5 bg-neutral-600 -rotate-45" />
      </div>
      <div className="absolute bottom-2 left-2 w-3 h-3 bg-neutral-400 rounded-full flex items-center justify-center">
        <div className="w-1.5 h-0.5 bg-neutral-600 rotate-45" />
        <div className="absolute w-1.5 h-0.5 bg-neutral-600 -rotate-45" />
      </div>
      <div className="absolute bottom-2 right-2 w-3 h-3 bg-neutral-400 rounded-full flex items-center justify-center">
        <div className="w-1.5 h-0.5 bg-neutral-600 rotate-45" />
        <div className="absolute w-1.5 h-0.5 bg-neutral-600 -rotate-45" />
      </div>

      <div className="relative w-[90%] h-[85%] bg-[#333] rounded-lg p-1 flex flex-col shadow-inner">
        <div className="h-[25%] bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 rounded-t-md relative overflow-hidden flex items-center px-4 border-b-2 border-black/20">
          <div className="absolute inset-0 bg-white/10" />
          <h2 className="text-white font-bold text-lg md:text-xl tracking-widest uppercase italic drop-shadow-md z-10 w-full text-center font-mono">
            Vapor <span className="text-cyan-200">Wave</span>
          </h2>
          <div className="absolute right-2 top-1 text-[10px] text-white/80 font-mono">
            A-SIDE
          </div>
        </div>

        <div className="flex-1 bg-neutral-800 relative flex items-center justify-center px-4 md:px-8 py-2 overflow-hidden">
          <div className="w-full h-full bg-neutral-900/80 rounded-md border border-neutral-700 relative flex items-center justify-between px-2 md:px-3 shadow-inner overflow-hidden">
            <motion.div
              className="w-12 h-12 md:w-16 md:h-16 rounded-full border-[3px] border-white/90 bg-transparent relative flex items-center justify-center shrink-0 z-10"
              animate={{ rotate: isPlaying ? 360 : 0 }}
              transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
            >
              <div
                className="absolute inset-0 bg-white"
                style={{
                  clipPath:
                    "polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)",
                  transform: "scale(0.3)",
                }}
              />
              <div className="absolute inset-0 border-[2px] border-white rounded-full opacity-50" />
              <div className="absolute inset-0 rounded-full border-[4px] border-[#4a3b32] -z-10" />
            </motion.div>

            <div className="flex-1 mx-2 hidden md:flex items-center justify-center pointer-events-none opacity-50 relative h-full">
              <div className="w-full h-[60%] bg-black/60 rounded clip-trapezoid blur-[1px]"></div>
              <div className="absolute w-full h-12 bg-[#4a3b32] top-1/2 -translate-y-1/2 -z-20 opacity-80" />
            </div>

            <motion.div
              className="w-12 h-12 md:w-16 md:h-16 rounded-full border-[3px] border-white/90 bg-transparent relative flex items-center justify-center shrink-0 z-10"
              animate={{ rotate: isPlaying ? 360 : 0 }}
              transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
            >
              <div
                className="absolute inset-0 bg-white"
                style={{
                  clipPath:
                    "polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)",
                  transform: "scale(0.3)",
                }}
              />
              <div className="absolute inset-0 border-[2px] border-white rounded-full opacity-50" />
              <div className="absolute inset-0 rounded-full border-[4px] border-[#4a3b32] -z-10" />
            </motion.div>
          </div>

          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-16 bg-[#2a2a2a] -z-10 opacity-50"></div>
        </div>

        <div className="h-[20%] bg-white rounded-b-md flex items-center justify-between px-4 border-t-2 border-black/20">
          <div className="font-handwriting text-neutral-800 text-xs md:text-sm -rotate-1 ml-2">
            Driftive Dreams
          </div>
          <div className="flex gap-1">
            <div className="w-4 h-4 rounded-sm bg-neutral-300 border border-neutral-400"></div>
            <div className="w-4 h-4 rounded-sm bg-neutral-300 border border-neutral-400"></div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 w-[50%] h-[12px] bg-neutral-300 rounded-t-lg border-t border-x border-neutral-400"></div>
    </div>
  );
};

export default CassetteTape;
