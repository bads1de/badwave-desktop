"use client";

import { useBackgroundSync } from "@/hooks/utils/useBackgroundSync";
import { useEffect } from "react";
import { electronAPI } from "@/libs/electron-utils";

/**
 * バックグラウンド同期を実行するコンポーネント
 * 画面には何も表示しません。
 */
export const SyncProvider = ({ children }: { children: React.ReactNode }) => {
  useBackgroundSync();

  useEffect(() => {
    // 将来的な初期化処理が必要ならここに記述
  }, []);

  return <>{children}</>;
};
