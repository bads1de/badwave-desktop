import { ipcMain, session } from "electron";
import store from "../lib/store";
import { debugLog } from "../utils";

// オフラインシミュレーション状態を追跡（外部からアクセス可能）
let isSimulatingOffline = false;

export function getIsSimulatingOffline() {
  return isSimulatingOffline;
}

export function setIsSimulatingOffline(value: boolean) {
  isSimulatingOffline = value;
}

export function setupSettingsHandlers() {
  // アプリケーション設定の取得
  ipcMain.handle("get-store-value", (_, key: string) => {
    return store.get(key);
  });

  // アプリケーション設定の保存
  ipcMain.handle("set-store-value", (_, key: string, value: any) => {
    store.set(key, value);
    return true;
  });

  // オフラインモードのシミュレーションを切り替え（開発用）
  ipcMain.handle("toggle-offline-simulation", async () => {
    isSimulatingOffline = !isSimulatingOffline;

    session.defaultSession.enableNetworkEmulation({
      offline: isSimulatingOffline,
    });

    debugLog(
      `[Debug] Offline simulation: ${isSimulatingOffline ? "ON" : "OFF"}`
    );
    return { isOffline: isSimulatingOffline };
  });

  // 現在のオフラインシミュレーション状態を取得
  ipcMain.handle("get-offline-simulation-status", () => {
    return { isOffline: isSimulatingOffline };
  });

  // オフラインシミュレーションを設定（明示的に ON/OFF）
  ipcMain.handle("set-offline-simulation", async (_, offline: boolean) => {
    isSimulatingOffline = offline;

    session.defaultSession.enableNetworkEmulation({
      offline: isSimulatingOffline,
    });

    debugLog(
      `[Debug] Offline simulation set to: ${isSimulatingOffline ? "ON" : "OFF"}`
    );
    return { isOffline: isSimulatingOffline };
  });
}
