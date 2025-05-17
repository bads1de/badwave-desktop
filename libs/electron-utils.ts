/**
 * Electronの機能を利用するためのユーティリティ関数
 *
 * このファイルはNext.jsアプリケーションからElectronの機能を安全に利用するための
 * ヘルパー関数を提供します。Electronの環境でない場合は代替の実装を提供します。
 */

/**
 * 現在の実行環境がElectronかどうかを判定
 */
export const isElectron = (): boolean => {
  if (
    typeof window !== "undefined" &&
    typeof (window as any).electron !== "undefined"
  ) {
    return (window as any).electron.appInfo.isElectron;
  }
  return false;
};

/**
 * アプリケーションのバージョンを取得
 */
export const getAppVersion = (): string => {
  if (isElectron()) {
    return (window as any).electron.appInfo.getVersion();
  }
  return process.env.NEXT_PUBLIC_APP_VERSION || "0.0.0";
};

/**
 * 実行プラットフォームを取得
 */
export const getPlatform = (): string => {
  if (isElectron()) {
    return (window as any).electron.appInfo.platform;
  }
  return "web";
};

/**
 * ウィンドウ操作
 */
export const windowControls = {
  minimize: (): Promise<void> => {
    if (isElectron()) {
      return (window as any).electron.window.minimize();
    }
    return Promise.resolve();
  },

  maximize: (): Promise<void> => {
    if (isElectron()) {
      return (window as any).electron.window.maximize();
    }
    return Promise.resolve();
  },

  close: (): Promise<void> => {
    if (isElectron()) {
      return (window as any).electron.window.close();
    }
    return Promise.resolve();
  },
};

/**
 * 設定ストア操作
 */
export const store = {
  get: async <T>(key: string, defaultValue?: T): Promise<T> => {
    if (isElectron()) {
      const value = await (window as any).electron.store.get(key);
      return value !== undefined ? value : (defaultValue as T);
    }

    // Electronでない場合はローカルストレージを使用
    if (typeof window !== "undefined" && window.localStorage) {
      const item = localStorage.getItem(key);
      if (item !== null) {
        try {
          return JSON.parse(item) as T;
        } catch (e) {
          console.error(`Error parsing localStorage item ${key}:`, e);
        }
      }
    }

    return defaultValue as T;
  },

  set: async <T>(key: string, value: T): Promise<boolean> => {
    if (isElectron()) {
      return (window as any).electron.store.set(key, value);
    }

    // Electronでない場合はローカルストレージを使用
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (e) {
        console.error(`Error setting localStorage item ${key}:`, e);
        return false;
      }
    }

    return false;
  },
};

/**
 * メディア制御
 */
export const mediaControls = {
  onMediaControl: (callback: (action: string) => void): (() => void) => {
    if (isElectron()) {
      return (window as any).electron.media.onMediaControl(callback);
    }

    // Electronでない場合は空の関数を返す
    return () => {};
  },
};

/**
 * IPC通信
 */
export const ipc = {
  invoke: async <T = any>(channel: string, ...args: any[]): Promise<T> => {
    if (isElectron()) {
      return (window as any).electron.ipc.invoke(channel, ...args);
    }

    console.warn(`IPC invoke called in non-Electron environment: ${channel}`);
    return Promise.reject(new Error("Not in Electron environment"));
  },

  on: <T = any>(
    channel: string,
    callback: (...args: T[]) => void
  ): (() => void) => {
    if (isElectron()) {
      return (window as any).electron.ipc.on(channel, callback);
    }

    // Electronでない場合は空の関数を返す
    return () => {};
  },

  send: (channel: string, ...args: any[]): void => {
    if (isElectron()) {
      (window as any).electron.ipc.send(channel, ...args);
    } else {
      console.warn(`IPC send called in non-Electron environment: ${channel}`);
    }
  },
};

/**
 * Electronの機能をまとめたオブジェクト
 */
export const electronAPI = {
  isElectron,
  getAppVersion,
  getPlatform,
  windowControls,
  store,
  mediaControls,
  ipc,
};
