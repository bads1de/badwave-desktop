import { isElectron } from "./common";

/**
 * 認証キャッシュ（オフラインログイン用）
 */
export const auth = {
  /**
   * ユーザー情報をローカルに保存
   */
  saveCachedUser: async (user: {
    id: string;
    email?: string;
    avatarUrl?: string;
  }): Promise<{ success: boolean }> => {
    if (isElectron()) {
      return (window as any).electron.auth.saveCachedUser(user);
    }
    return { success: false };
  },

  /**
   * ローカルに保存されたユーザー情報を取得
   */
  getCachedUser: async (): Promise<{
    id: string;
    email?: string;
    avatarUrl?: string;
  } | null> => {
    if (isElectron()) {
      return (window as any).electron.auth.getCachedUser();
    }
    return null;
  },

  /**
   * ローカルのユーザー情報をクリア
   */
  clearCachedUser: async (): Promise<{ success: boolean }> => {
    if (isElectron()) {
      return (window as any).electron.auth.clearCachedUser();
    }
    return { success: false };
  },
};
