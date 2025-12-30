"use client";

import { motion } from "framer-motion";
import { RefreshCw, Database } from "lucide-react";
import { toast } from "react-hot-toast";
import { isElectron } from "@/libs/electron-utils";
import { useSyncLikedSongs } from "@/hooks/sync/useSyncLikedSongs";
import { useSyncPlaylists } from "@/hooks/sync/useSyncPlaylists";

export const SyncSection = () => {
  const { sync: syncLiked, isSyncing: isSyncingLiked } = useSyncLikedSongs({
    autoSync: false,
  });
  const { sync: syncPlaylists, isSyncing: isSyncingPlaylists } =
    useSyncPlaylists({ autoSync: false });

  const handleSyncLiked = async () => {
    const result = await syncLiked();
    if (result.success) {
      toast.success("お気に入り曲を同期しました");
    } else {
      toast.error("同期に失敗しました");
    }
  };

  const handleSyncPlaylists = async () => {
    const result = await syncPlaylists();
    if (result.success) {
      toast.success("プレイリストを同期しました");
    } else {
      toast.error("同期に失敗しました");
    }
  };

  if (!isElectron()) return null;

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-neutral-900/80 via-neutral-800/20 to-neutral-900/80 backdrop-blur-xl border border-white/[0.05] shadow-lg rounded-2xl p-8">
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-theme-500/10 rounded-full blur-3xl"></div>

      <div className="relative">
        <div className="mb-6 flex items-center gap-3">
          <Database className="w-6 h-6 text-theme-400" />
          <div>
            <h3 className="text-xl font-bold text-white">ライブラリ同期</h3>
            <p className="text-sm text-neutral-400">
              オフライン環境に備えてローカルデータを最新の状態に保ちます
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <motion.button
            onClick={handleSyncLiked}
            disabled={isSyncingLiked}
            className={`
              flex items-center justify-between p-4 rounded-xl transition-all duration-300
              ${
                isSyncingLiked
                  ? "bg-neutral-800/30 border-white/5 opacity-50 cursor-not-allowed"
                  : "bg-neutral-800/50 hover:bg-neutral-700/50 border border-white/5 active:scale-95"
              }
            `}
            whileHover={!isSyncingLiked ? { scale: 1.02 } : {}}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg bg-red-500/10 ${
                  isSyncingLiked ? "animate-spin" : ""
                }`}
              >
                <RefreshCw
                  className={`w-5 h-5 text-red-500 ${
                    isSyncingLiked ? "animate-spin" : ""
                  }`}
                />
              </div>
              <div className="text-left">
                <p className="font-medium text-white">お気に入り曲を同期</p>
                <p className="text-xs text-neutral-400">
                  {isSyncingLiked ? "同期中..." : "最新の状態に更新"}
                </p>
              </div>
            </div>
          </motion.button>

          <motion.button
            onClick={handleSyncPlaylists}
            disabled={isSyncingPlaylists}
            className={`
              flex items-center justify-between p-4 rounded-xl transition-all duration-300
              ${
                isSyncingPlaylists
                  ? "bg-neutral-800/30 border-white/5 opacity-50 cursor-not-allowed"
                  : "bg-neutral-800/50 hover:bg-neutral-700/50 border border-white/5 active:scale-95"
              }
            `}
            whileHover={!isSyncingPlaylists ? { scale: 1.02 } : {}}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg bg-blue-500/10 ${
                  isSyncingPlaylists ? "animate-spin" : ""
                }`}
              >
                <RefreshCw
                  className={`w-5 h-5 text-blue-500 ${
                    isSyncingPlaylists ? "animate-spin" : ""
                  }`}
                />
              </div>
              <div className="text-left">
                <p className="font-medium text-white">プレイリストを同期</p>
                <p className="text-xs text-neutral-400">
                  {isSyncingPlaylists ? "同期中..." : "最新の状態に更新"}
                </p>
              </div>
            </div>
          </motion.button>
        </div>
      </div>
    </div>
  );
};
