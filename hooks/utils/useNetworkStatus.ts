"use client";

import { useState, useEffect, useCallback } from "react";

export interface NetworkStatus {
  /** 現在オンラインかどうか */
  isOnline: boolean;
  /** セッション中に一度でもオフラインになったか */
  wasOffline: boolean;
}

/**
 * ネットワーク接続状態を監視するカスタムフック
 *
 * @returns {NetworkStatus} ネットワーク状態オブジェクト
 *
 * @example
 * ```tsx
 * const { isOnline, wasOffline } = useNetworkStatus();
 *
 * if (!isOnline) {
 *   return <OfflineBanner />;
 * }
 * ```
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

    // イベントリスナーを登録
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // クリーンアップ
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return {
    isOnline,
    wasOffline,
  };
}
