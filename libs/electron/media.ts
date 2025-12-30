import { isElectron } from "./common";

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
