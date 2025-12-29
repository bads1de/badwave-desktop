"use client";

import { useCallback } from "react";
import { onlineManager } from "@tanstack/react-query";
import { electronAPI } from "@/libs/electron-utils";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";

/**
 * ネットワーク状態とElectronのシミュレーション状態を考慮して
 * 現在の正確なオフライン状態をチェックするフック
 *
 * onlineManager と連携しているため、TanStack Query と一貫した状態を提供します。
 * 非同期処理内で最新の状態を確認するための checkOffline 関数も提供します。
 */
export const useOfflineCheck = () => {
  const status = useNetworkStatus();

  /**
   * 最新のオフライン状態を非同期で確認
   * queryFn 内など、リアルタイムの状態確認が必要な場合に使用
   */
  const checkOffline = useCallback(async () => {
    // onlineManager から最新の状態を取得
    let isCurrentlyOffline = !onlineManager.isOnline();

    // Electronの場合はメインプロセスに問い合わせて確実な状態を取得
    if (electronAPI.isElectron()) {
      try {
        const simStatus = await electronAPI.dev.getOfflineSimulationStatus();
        if (simStatus.isOffline) {
          isCurrentlyOffline = true;
        }
      } catch (error) {
        // エラー時は onlineManager ベースの判定を維持
      }
    }
    return isCurrentlyOffline;
  }, []);

  return { ...status, checkOffline };
};
