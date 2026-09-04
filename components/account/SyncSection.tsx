"use client";

import { motion } from "framer-motion";
import { RefreshCw, Database, LayoutGrid } from "lucide-react";
import { toast } from "react-hot-toast";
import { isElectron } from "@/libs/electron";
import { useSyncLikedSongs } from "@/hooks/sync/useSyncLikedSongs";
import { useSyncPlaylists } from "@/hooks/sync/useSyncPlaylists";
import { useSyncHomeAll } from "@/hooks/sync/useSyncHomeAll";
import { ERROR_MESSAGES } from "@/constants/errorMessages";
import { twMerge } from "tailwind-merge";
import { useCallback } from "react";

export const SyncSection = () => {
  const { sync: syncLiked, isSyncing: isSyncingLiked } = useSyncLikedSongs({
    autoSync: false,
  });
  const { sync: syncPlaylists, isSyncing: isSyncingPlaylists } =
    useSyncPlaylists({ autoSync: false });
  const { sync: syncHome, isSyncing: isSyncingHome } = useSyncHomeAll();

  const handleSyncLiked = useCallback(async () => {
    const result = await syncLiked();
    if (result.success) {
      toast.success("お気に入り曲を同期しました");
    } else {
      toast.error(ERROR_MESSAGES.SYNC_FAILED);
    }
  }, [syncLiked]);

  const handleSyncPlaylists = useCallback(async () => {
    const result = await syncPlaylists();
    if (result.success) {
      toast.success("プレイリストを同期しました");
    } else {
      toast.error(ERROR_MESSAGES.SYNC_FAILED);
    }
  }, [syncPlaylists]);

  const handleSyncHome = useCallback(async () => {
    const result = await syncHome();
    if (result.success) {
      toast.success("ホーム画面のデータを更新しました");
    } else {
      toast.error(ERROR_MESSAGES.HOME_SYNC_FAILED);
    }
  }, [syncHome]);

  if (!isElectron()) return null;

  return (
    <div className="relative bg-[#0a0a0f] border border-theme-500/10 p-8 rounded-none overflow-hidden group shadow-[0_0_30px_rgba(0,0,0,0.5)]">
      {/* HUD装飾 */}
      <div className="absolute top-0 right-0 w-6 h-6 border-t border-r border-theme-500/40 group-hover:border-theme-500 transition-all" />
      <div className="absolute bottom-0 left-0 w-6 h-6 border-b border-l border-theme-500/40 group-hover:border-theme-500 transition-all" />

      <div className="relative">
        <div className="mb-8 font-mono">
          <div className="flex items-center gap-2 mb-1">
            <Database className="w-4 h-4 text-theme-500" />
            <h3 className="text-[10px] font-black text-theme-500 uppercase tracking-[0.4em]">DATABASE_SYNC_SYSTEM</h3>
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-widest">ライブラリ同期</h2>
          <p className="text-[9px] text-theme-500/40 uppercase tracking-widest mt-1">
            // SYNC_LOCAL_BUFFERS_WITH_MAIN_NET_REGISTRY
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { 
              label: "FAVORITES_LINK", 
              desc: "LIKED_SONGS_BUFFER", 
              icon: RefreshCw, 
              color: "text-red-500", 
              bg: "bg-red-500/5", 
              action: handleSyncLiked, 
              loading: isSyncingLiked 
            },
            { 
              label: "COLLECTIONS_LINK", 
              desc: "PLAYLIST_DATA_BUFFER", 
              icon: RefreshCw, 
              color: "text-theme-500", 
              bg: "bg-theme-500/5", 
              action: handleSyncPlaylists, 
              loading: isSyncingPlaylists 
            },
            { 
              label: "GATEWAY_SYNC", 
              desc: "HOME_FEED_MANIFEST", 
              icon: LayoutGrid, 
              color: "text-cyan-500", 
              bg: "bg-cyan-500/5", 
              action: handleSyncHome, 
              loading: isSyncingHome 
            },
          ].map((item, i) => (
            <motion.button
              key={i}
              onClick={item.action}
              disabled={item.loading}
              className={twMerge(
                "relative p-4 text-left transition-all duration-300 rounded-none border group/item flex flex-col gap-4",
                item.loading
                  ? "border-theme-500/5 bg-black/20 opacity-50 cursor-not-allowed"
                  : "border-theme-500/10 bg-black/40 hover:bg-theme-500/5 hover:border-theme-500/40"
              )}
              whileHover={!item.loading ? { scale: 1.02 } : {}}
            >
              <div className="flex items-center justify-between font-mono">
                <div className={twMerge("p-2 rounded-none", item.bg)}>
                  <item.icon className={twMerge("w-5 h-5", item.color, item.loading && "animate-spin")} />
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[7px] text-theme-500/40 uppercase">Task_State</span>
                  <span className={twMerge("text-[8px] font-black uppercase", item.loading ? "text-theme-500 animate-pulse" : "text-white/40")}>
                    {item.loading ? "LINKING..." : "STANDBY"}
                  </span>
                </div>
              </div>

              <div className="font-mono">
                <h4 className="font-black text-xs text-white uppercase tracking-widest leading-none mb-1">
                  {item.label}
                </h4>
                <p className="text-[8px] text-theme-500/30 uppercase tracking-tighter">
                  // {item.desc}
                </p>
              </div>

              {/* Decoration */}
              <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-theme-500/20 group-hover/item:border-theme-500/60 transition-colors" />
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};
