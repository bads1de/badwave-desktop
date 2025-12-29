"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import { onlineManager } from "@tanstack/react-query";
import { electronAPI } from "@/libs/electron-utils";

export interface NetworkStatus {
  /** 現在オンラインかどうか (onlineManager と同期) */
  isOnline: boolean;
  /** セッション中に一度でもオフラインになったか */
  wasOffline: boolean;
  /** 初期化が完了したかどうか */
  isInitialized: boolean;
}

/**
 * onlineManager の状態を購読する関数
 */
function subscribeToOnlineManager(callback: () => void): () => void {
  return onlineManager.subscribe(callback);
}

/**
 * onlineManager から現在のオンライン状態を取得
 */
function getOnlineSnapshot(): boolean {
  return onlineManager.isOnline();
}

/**
 * SSR用のスナップショット
 */
function getServerSnapshot(): boolean {
  return true; // SSR時はオンラインとみなす
}

/**
 * ネットワーク接続状態を監視するカスタムフック
 *
 * TanStack Query の onlineManager と同期されています。
 * UI コンポーネントでオフラインインジケーターを表示する場合などに使用します。
 */
export function useNetworkStatus(): NetworkStatus {
  // onlineManager の状態を useSyncExternalStore で購読
  const isOnline = useSyncExternalStore(
    subscribeToOnlineManager,
    getOnlineSnapshot,
    getServerSnapshot
  );

  const [wasOffline, setWasOffline] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // オフライン履歴を追跡
  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    }
  }, [isOnline]);

  // 初期化状態を管理
  useEffect(() => {
    if (electronAPI.isElectron()) {
      // Electron の場合: シミュレーション状態を取得してから初期化完了
      electronAPI.dev
        .getOfflineSimulationStatus()
        .then(() => {
          setIsInitialized(true);
        })
        .catch(() => {
          setIsInitialized(true);
        });
    } else {
      // Electron 以外: 即座に初期化完了
      setIsInitialized(true);
    }
  }, []);

  return {
    isOnline,
    wasOffline,
    isInitialized,
  };
}
