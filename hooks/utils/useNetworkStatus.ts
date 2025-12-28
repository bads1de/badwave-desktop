"use client";

import { useState, useEffect, useCallback } from "react";
import { electronAPI } from "@/libs/electron-utils";

export interface NetworkStatus {
  /** 現在オンラインかどうか */
  isOnline: boolean;
  /** セッション中に一度でもオフラインになったか */
  wasOffline: boolean;
  /** 初期化が完了したかどうか */
  isInitialized: boolean;
}

/**
 * ネットワーク接続状態を監視するカスタムフック
 */
export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  const handleOnline = useCallback(() => {
    setIsOnline(true);
  }, []);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
    setWasOffline(true);
  }, []);

  useEffect(() => {
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Electron の場合: シミュレーション状態を取得してから初期化完了
    if (electronAPI.isElectron()) {
      (window as any).electron.dev
        .getOfflineSimulationStatus()
        .then(({ isOffline }: { isOffline: boolean }) => {
          if (isOffline) {
            handleOffline();
          } else if (!window.navigator.onLine) {
            handleOffline();
          } else {
            handleOnline();
          }
          setIsInitialized(true);
        })
        .catch(() => {
          setIsInitialized(true);
        });

      // IPC イベントをリッスン
      const unsubscribe = (window as any).electron?.ipc?.on(
        "offline-simulation-changed",
        (isSimulatingOffline: boolean) => {
          if (isSimulatingOffline) {
            handleOffline();
          } else {
            handleOnline();
          }
        }
      );

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
        if (unsubscribe) unsubscribe();
      };
    } else {
      // Electron 以外: 即座に初期化完了
      setIsInitialized(true);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return {
    isOnline,
    wasOffline,
    isInitialized,
  };
}
