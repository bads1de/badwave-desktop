"use client";

import { onlineManager, focusManager } from "@tanstack/react-query";
import { electronAPI } from "@/libs/electron-utils";

/**
 * TanStack Query の onlineManager を設定
 *
 * このモジュールは一度だけインポートされ、Electron の IPC イベントと
 * ブラウザのオンライン/オフラインイベントを onlineManager に連携します。
 *
 * これにより、各クエリで手動で `enabled: isOnline` を設定する必要がなくなります。
 */
export function setupOnlineManager(): void {
  // SSR 環境では実行しない
  if (typeof window === "undefined") return;

  onlineManager.setEventListener((setOnline) => {
    // ブラウザのオンライン/オフラインイベント
    const handleOnline = () => {
      // Electron の場合はシミュレーション状態も確認
      if (electronAPI.isElectron()) {
        electronAPI.dev.getOfflineSimulationStatus().then(({ isOffline }) => {
          setOnline(!isOffline);
        });
      } else {
        setOnline(true);
      }
    };

    const handleOffline = () => {
      setOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Electron の場合: シミュレーション状態変更イベントをリッスン
    let unsubscribeIpc: (() => void) | undefined;

    if (electronAPI.isElectron()) {
      // 初期状態を取得
      electronAPI.dev.getOfflineSimulationStatus().then(({ isOffline }) => {
        setOnline(!isOffline && navigator.onLine);
      });

      // IPC イベントをリッスン
      unsubscribeIpc = (window as any).electron?.ipc?.on(
        "offline-simulation-changed",
        (isSimulatingOffline: boolean) => {
          if (isSimulatingOffline) {
            setOnline(false);
          } else {
            // シミュレーション解除時は実際のネットワーク状態を確認
            setOnline(navigator.onLine);
          }
        }
      );
    }

    // クリーンアップ関数
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      unsubscribeIpc?.();
    };
  });

  console.log("[TanStack Query] onlineManager configured");
}

/**
 * TanStack Query の focusManager を設定
 *
 * Electron 環境では標準の window focus イベントが正しく動作しない場合があるため、
 * visibilitychange イベントを使用します。
 */
export function setupFocusManager(): void {
  // SSR 環境では実行しない
  if (typeof window === "undefined") return;

  // Electron 環境の場合のみカスタム focusManager を設定
  if (electronAPI.isElectron()) {
    focusManager.setEventListener((handleFocus) => {
      const onVisibilityChange = () => {
        handleFocus(document.visibilityState === "visible");
      };

      document.addEventListener("visibilitychange", onVisibilityChange);

      return () => {
        document.removeEventListener("visibilitychange", onVisibilityChange);
      };
    });

    console.log("[TanStack Query] focusManager configured for Electron");
  }
}

/**
 * オンライン復帰時に paused mutations を再開するためのセットアップ
 *
 * @param queryClient - QueryClient インスタンス
 */
export function setupMutationResume(
  queryClient: import("@tanstack/react-query").QueryClient
): () => void {
  const unsubscribe = onlineManager.subscribe((isOnline) => {
    if (isOnline) {
      // オンライン復帰時に paused mutations を再開
      queryClient.resumePausedMutations().then(() => {
        // mutations 完了後にクエリを再検証
        queryClient.invalidateQueries();
      });
    }
  });

  return unsubscribe;
}
