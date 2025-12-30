import { isElectron } from "./common";

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
