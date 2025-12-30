import { useState, useCallback } from "react";
import { useSyncTrends } from "./useSyncTrends";
import { useSyncSpotlight } from "./useSyncSpotlight";
import { useSyncLatestSongs } from "./useSyncLatestSongs";
import { useSyncRecommendations } from "./useSyncRecommendations";
import { useSyncPublicPlaylists } from "./useSyncPublicPlaylists";

/**
 * ホーム画面のすべてのセクションを同期する統合フック
 */
export const useSyncHomeAll = () => {
  const { sync: syncTrends } = useSyncTrends("all", { autoSync: false });
  const { sync: syncSpotlight } = useSyncSpotlight({ autoSync: false });
  const { sync: syncLatest } = useSyncLatestSongs(12, { autoSync: false });
  const { sync: syncRecs } = useSyncRecommendations(10, { autoSync: false });
  const { sync: syncPlaylists } = useSyncPublicPlaylists(6, {
    autoSync: false,
  });

  const [isSyncing, setIsSyncing] = useState(false);

  const sync = useCallback(async () => {
    setIsSyncing(true);
    try {
      console.log("[useSyncHomeAll] Starting full home sync...");

      const results = await Promise.all([
        syncTrends(),
        syncSpotlight(),
        syncLatest(),
        syncRecs(),
        syncPlaylists(),
      ]);

      const failed = results.filter((r) => !r.success);
      if (failed.length > 0) {
        console.warn(`[useSyncHomeAll] Some syncs failed:`, failed);
        return { success: false, results };
      }

      console.log("[useSyncHomeAll] Full home sync completed successfully");
      return { success: true };
    } catch (error) {
      console.error("[useSyncHomeAll] Critical sync failure:", error);
      return { success: false, error };
    } finally {
      setIsSyncing(false);
    }
  }, [syncTrends, syncSpotlight, syncLatest, syncRecs, syncPlaylists]);

  return { sync, isSyncing };
};
