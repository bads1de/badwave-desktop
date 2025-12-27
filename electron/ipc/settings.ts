import { ipcMain } from "electron";
import store from "../lib/store";

export function setupSettingsHandlers() {
  // アプリケーション設定の取得
  ipcMain.handle("get-store-value", (_, key: string) => {
    return store.get(key);
  });

  // アプリケーション設定の保存
  ipcMain.handle("set-store-value", (_, key: string, value: any) => {
    // 設定値をストアに直接保存
    store.set(key, value);
    return true;
  });
}
