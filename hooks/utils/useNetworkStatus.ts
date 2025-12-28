"use client";

import { useState, useEffect, useCallback } from "react";
import { electronAPI } from "@/libs/electron-utils";

export interface NetworkStatus {
  /** 現在オンラインかどうか */
  isOnline: boolean;
  /** セッション中に一度でもオフラインになったか */
  wasOffline: boolean;
}

/**
 * ネットワーク接続状態を監視するカスタムフック
 *
 * ブラウザの navigator.onLine と、Electron のオフラインシミュレーション
 * の両方に対応しています。
 *
 * @returns {NetworkStatus} ネットワーク状態オブジェクト
 */
export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState<boolean>(false);

  const handleOnline = useCallback(() => {
    setIsOnline(true);
  }, []);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
    setWasOffline(true);
  }, []);

  useEffect(() => {
    // 初期状態を設定
    if (typeof navigator !== "undefined") {
      setIsOnline(navigator.onLine);
    }

    // ブラウザのイベントリスナーを登録
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Electron のオフラインシミュレーションイベントをリッスン
    let unsubscribe: (() => void) | undefined;
    if (electronAPI.isElectron()) {
      try {
        // electronAPI.ipc.on を使用
        unsubscribe = (window as any).electron?.ipc?.on(
          "offline-simulation-changed",
          (isSimulatingOffline: boolean) => {
            if (isSimulatingOffline) {
              handleOffline();
            } else {
              handleOnline();
            }
          }
        );
      } catch (e) {
        console.error("Failed to listen for offline simulation:", e);
      }
    }

    // クリーンアップ
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [handleOnline, handleOffline]);

  return {
    isOnline,
    wasOffline,
  };
}
