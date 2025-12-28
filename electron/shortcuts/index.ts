import { globalShortcut, session, BrowserWindow } from "electron";
import { getMainWindow } from "../lib/window-manager";
import { debugLog } from "../utils";
import {
  getIsSimulatingOffline,
  setIsSimulatingOffline,
} from "../ipc/settings";

/**
 * 開発用ショートカットキーのセットアップ
 */
export function setupDevShortcuts() {
  // Ctrl+Shift+O: オフラインモードのトグル
  globalShortcut.register("CommandOrControl+Shift+O", () => {
    // settings.ts の状態を更新
    const newState = !getIsSimulatingOffline();
    setIsSimulatingOffline(newState);

    const mainWindow = getMainWindow();
    if (mainWindow) {
      // 1. ネットワークエミュレーションの設定
      mainWindow.webContents.session.enableNetworkEmulation({
        offline: newState,
      });

      // 2. WebRequestによる強制ブロック (localhost以外)
      const filter = { urls: ["*://*/*"] };
      if (newState) {
        session.defaultSession.webRequest.onBeforeRequest(
          filter,
          (details, callback) => {
            if (
              details.url.includes("localhost") ||
              details.url.includes("127.0.0.1")
            ) {
              callback({ cancel: false });
            } else {
              callback({ cancel: true });
            }
          }
        );
      } else {
        session.defaultSession.webRequest.onBeforeRequest(filter, null);
      }

      // レンダラーに通知を送信
      mainWindow.webContents.send("offline-simulation-changed", newState);
    }

    debugLog(
      `[Shortcut] Offline simulation: ${newState ? "ON" : "OFF"} (Ctrl+Shift+O)`
    );
  });

  // Ctrl+Shift+I: DevToolsを開く
  globalShortcut.register("CommandOrControl+Shift+I", () => {
    const mainWindow = getMainWindow();
    if (mainWindow) {
      mainWindow.webContents.openDevTools();
    }
  });

  debugLog("Ctrl+Shift+I = Open DevTools, Ctrl+Shift+O = Toggle Offline Mode");
}
