import { isElectron } from "./common";

// 開発用ユーティリティ
export const dev = {
  /**
   * オフラインモードのシミュレーションを切り替え（トグル）
   * 開発時にネットワーク接続なしでオフライン機能をテストするために使用
   */
  toggleOfflineSimulation: async (): Promise<{ isOffline: boolean }> => {
    if (isElectron()) {
      return (window as any).electron.dev.toggleOfflineSimulation();
    }
    console.warn("Offline simulation is only available in Electron");
    return { isOffline: false };
  },

  /**
   * 現在のオフラインシミュレーション状態を取得
   */
  getOfflineSimulationStatus: async (): Promise<{ isOffline: boolean }> => {
    if (isElectron()) {
      return (window as any).electron.dev.getOfflineSimulationStatus();
    }
    return { isOffline: false };
  },

  /**
   * オフラインシミュレーションを明示的に ON/OFF
   * @param offline - trueでオフラインモードをシミュレート
   */
  setOfflineSimulation: async (
    offline: boolean
  ): Promise<{ isOffline: boolean }> => {
    if (isElectron()) {
      return (window as any).electron.dev.setOfflineSimulation(offline);
    }
    console.warn("Offline simulation is only available in Electron");
    return { isOffline: false };
  },
};
