"use client";

import { useCallback } from "react";
import { electronAPI } from "@/libs/electron-utils";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";

/**
 * ネットワーク状態とElectronのシミュレーション状態を考慮して
 * 現在の正確なオフライン状態をチェックするフック
 * （主にqueryFn内などの非同期処理で最新の状態を確認するために使用）
 */
export const useOfflineCheck = () => {
  const { isOnline } = useNetworkStatus();

  const checkOffline = useCallback(async () => {
    // まず状態ベースで判定
    let isCurrentlyOffline = !isOnline;

    // Electronの場合はメインプロセスに問い合わせて確実な状態を取得
    if (electronAPI.isElectron()) {
      try {
        const status = await (
          window as any
        ).electron.dev.getOfflineSimulationStatus();
        isCurrentlyOffline = status.isOffline;
      } catch (error) {
        // エラー時は元の isOnline ベースの判定を維持
      }
    }
    return isCurrentlyOffline;
  }, [isOnline]);

  return { checkOffline };
};
