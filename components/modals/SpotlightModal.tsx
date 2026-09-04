import React, { useEffect, useRef, useCallback, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import useSpotlightModal from "@/hooks/modal/useSpotlightModal";
import useVolumeStore from "@/hooks/stores/useVolumeStore";
import { cn } from "@/libs/utils";
import { DURATIONS } from "@/constants";

const SpotlightModal = () => {
  const { isOpen, onClose } = useSpotlightModal();
  const selectedItem = useSpotlightModal((state) => state.selectedItem);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const bgVideoRef = useRef<HTMLVideoElement | null>(null);
  const { volume } = useVolumeStore();
  const [isLoading, setIsLoading] = useState(true);

  // Sync background video with main video
  const setupVideoSync = useCallback(() => {
    const mainVideo = videoRef.current;
    const bgVideo = bgVideoRef.current;

    if (!mainVideo || !bgVideo) return () => {};

    const syncPlay = () => bgVideo.play().catch(() => {});
    const syncPause = () => bgVideo.pause();
    const syncTime = () => {
      if (Math.abs(bgVideo.currentTime - mainVideo.currentTime) > 0.2) {
        bgVideo.currentTime = mainVideo.currentTime;
      }
    };

    mainVideo.addEventListener("play", syncPlay);
    mainVideo.addEventListener("pause", syncPause);
    mainVideo.addEventListener("timeupdate", syncTime);
    mainVideo.addEventListener("seeking", syncTime);

    return () => {
      mainVideo.removeEventListener("play", syncPlay);
      mainVideo.removeEventListener("pause", syncPause);
      mainVideo.removeEventListener("timeupdate", syncTime);
      mainVideo.removeEventListener("seeking", syncTime);
    };
  }, []);

  // Handle video playback and sync
  useEffect(() => {
    if (!isOpen) {
      videoRef.current?.pause();
      bgVideoRef.current?.pause();
      return;
    }

    setIsLoading(true);
    const mainVideo = videoRef.current;
    if (!mainVideo) return;

    mainVideo.volume = (volume ?? 1) * 0.5;
    mainVideo.play().catch((error) => console.error("Playback failed:", error));

    const cleanup = setupVideoSync();
    return cleanup;
  }, [isOpen, selectedItem?.id, volume, setupVideoSync]);

  if (!selectedItem) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0a0a0f]/95 z-[100] backdrop-blur-xl transition-all duration-500 font-mono flex items-center justify-center p-4 md:p-10 lg:p-16 overflow-hidden"
          >
            {/* Background Decor (Grid) */}
            <div 
              className="absolute inset-0 opacity-[0.03] pointer-events-none" 
              style={{ 
                backgroundImage: `linear-gradient(rgba(var(--theme-500), 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--theme-500), 0.5) 1px, transparent 1px)`,
                backgroundSize: '100px 100px'
              }} 
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              transition={{ duration: DURATIONS.NORMAL, ease: [0.19, 1, 0.22, 1] }}
              className="relative w-full max-w-7xl mx-auto flex flex-col md:flex-row bg-[#0a0a0f] border border-theme-500/20 shadow-[0_0_60px_rgba(0,0,0,0.8),0_0_20px_rgba(var(--theme-500),0.05)] h-[90vh] md:h-[80vh] overflow-hidden group rounded-none"
            >
              {/* HUD Corners */}
              <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-theme-500/30 pointer-events-none z-50" />
              <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-theme-500/30 pointer-events-none z-50" />

              {/* Close Button (HUD Style) */}
              <button
                onClick={onClose}
                aria-label="Close spotlight"
                className="absolute right-6 top-6 z-[60] p-3 bg-theme-500/10 hover:bg-theme-500 text-theme-500 hover:text-[#0a0a0f] border border-theme-500/30 transition-all duration-300 shadow-[0_0_15px_rgba(var(--theme-500),0.2)] active:scale-95"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Video Section */}
              <div className="w-full md:w-[60%] lg:w-[65%] bg-[#050508] relative overflow-hidden flex items-center justify-center shrink-0 border-r border-theme-500/10">
                {selectedItem.video_path && (
                  <>
                    {/* Synchronized Background Blur Layer */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
                      <video
                        ref={bgVideoRef}
                        src={selectedItem.video_path}
                        muted
                        loop
                        playsInline
                        className="w-full h-full object-cover blur-3xl scale-110 saturate-150"
                      />
                    </div>

                    {/* Scanlines Decor */}
                    <div className="absolute inset-0 pointer-events-none opacity-5 z-20 bg-[length:100%_4px] bg-[linear-gradient(rgba(255,255,255,0)_50%,rgba(0,0,0,0.5)_50%)]" />

                    {/* Main Video Layer */}
                    <video
                      ref={videoRef}
                      key={selectedItem.video_path}
                      src={selectedItem.video_path}
                      loop
                      playsInline
                      muted={false}
                      controls={false}
                      onClick={() => {
                        const v = videoRef.current;
                        if (v) v.paused ? v.play() : v.pause();
                      }}
                      onLoadedData={() => setIsLoading(false)}
                      className={cn(
                        "relative max-w-full max-h-full w-full h-full object-contain z-10 cursor-pointer transition-opacity duration-1000",
                        isLoading ? "opacity-0" : "opacity-80 hover:opacity-100"
                      )}
                    />

                    {/* Top Info Overlay (HUD Style) - Positioned more tightly */}
                    <div className="absolute top-8 left-8 z-30 flex flex-col gap-1 pointer-events-none">
                       <div className="flex items-center gap-2 text-[8px] text-theme-500 tracking-[0.5em] uppercase animate-pulse font-bold">
                          <span className="w-1.5 h-1.5 bg-theme-500 rounded-full shadow-[0_0_8px_rgba(var(--theme-500),1)]" />
                          [ SIGNAL_MONITOR_ACTIVE ]
                       </div>
                       <div className="text-[10px] text-theme-500/30 uppercase font-black tracking-widest">
                          RES: 1920x1080 // SYNC_STATUS: STABLE
                       </div>
                    </div>

                    {/* Loading State Scanner */}
                    {isLoading && (
                      <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#0a0a0f]/60 backdrop-blur-sm overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-theme-500/10 to-transparent h-full w-full animate-scanline-skeleton" />
                        <p className="relative z-50 text-theme-500 font-black tracking-[0.6em] animate-pulse text-[10px]">INITIATING_CORE_SYNC...</p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Sidebar Content Section (Terminal Style) */}
              <div className="w-full md:flex-1 bg-[#0a0a0f] flex flex-col h-full relative z-20">
                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8 lg:p-12 space-y-10">
                  {/* Header - Tightened Alignment */}
                  <div className="space-y-8 pb-10 border-b border-theme-500/10">
                    <div className="flex items-center gap-6">
                      <div className="h-16 w-16 border border-theme-500/40 bg-theme-500/5 flex items-center justify-center shrink-0 shadow-[inset_0_0_15px_rgba(var(--theme-500),0.1)] relative">
                        <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-theme-500 shadow-[0_0_10px_rgba(var(--theme-500),0.5)]" />
                        <span className="font-black text-theme-500 text-3xl drop-shadow-[0_0_8px_rgba(var(--theme-500),0.5)]">
                          {selectedItem.author.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <p className="text-[9px] text-theme-500/50 uppercase tracking-[0.4em] font-black">
                           [ OPERATOR_IDENTIFIED ]
                        </p>
                        <h3 className="font-black text-white text-2xl tracking-[0.1em] hover:text-theme-400 transition-colors cursor-pointer uppercase leading-none">
                          {selectedItem.author}
                        </h3>
                      </div>
                    </div>
                    
                    <div className="inline-block px-5 py-2 border border-theme-500/30 bg-theme-500/5 text-theme-400 text-[10px] font-black uppercase tracking-[0.4em] shadow-[inset_0_0_15px_rgba(var(--theme-500),0.05)]">
                       SECTOR: {selectedItem.genre}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-8">
                    <div className="space-y-3">
                       <p className="text-[9px] text-theme-500/30 uppercase tracking-[0.3em] font-black">
                          // DATA_STREAM_METADATA
                       </p>
                       <h2 className="text-4xl font-black text-white leading-[1.1] uppercase tracking-tighter drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                         {selectedItem.title}
                       </h2>
                    </div>
                    
                    <div className="relative p-8 bg-theme-500/[0.02] border border-theme-500/10 group/desc overflow-hidden">
                       <div className="absolute top-0 left-0 w-3 h-px bg-theme-500" />
                       <div className="absolute top-0 left-0 w-px h-3 bg-theme-500" />
                       <p className="relative z-10 text-theme-100/60 text-xs leading-relaxed tracking-wider">
                         {selectedItem.description || "NO_DESCRIPTION_DATA_AVAILABLE_IN_THIS_NODE."}
                       </p>
                    </div>
                  </div>
                </div>

                {/* Footer Metadata */}
                <div className="p-8 border-t border-theme-500/10 flex justify-between items-center text-[8px] text-theme-500/20 uppercase tracking-[0.4em] font-black bg-[#0a0a0f]/50">
                   <div className="flex gap-6">
                      <span>NODE_ID: {String(selectedItem.id).slice(0, 8)}</span>
                      <span>V_TYPE: MP4_RAW</span>
                   </div>
                   <span className="animate-pulse text-theme-500/40">CONNECTION: ENCRYPTED</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Dialog>
  );
};

export default SpotlightModal;
