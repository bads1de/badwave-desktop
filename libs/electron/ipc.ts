import { isElectron } from "./common";

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
