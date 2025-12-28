import { ipcMain } from "electron";
import Store from "electron-store";

interface CachedUser {
  id: string;
  email: string | undefined;
  avatarUrl?: string;
}

const store = new Store<{ cachedUser: CachedUser | null }>();

export function setupAuthHandlers() {
  /**
   * ユーザー情報をローカルに保存
   */
  ipcMain.handle("save-cached-user", async (_, user: CachedUser) => {
    try {
      store.set("cachedUser", user);
      return { success: true };
    } catch (error: any) {
      console.error("[Auth] Failed to save user:", error);
      return { success: false, error: error.message };
    }
  });

  /**
   * ローカルに保存されたユーザー情報を取得
   */
  ipcMain.handle("get-cached-user", async () => {
    try {
      const user = store.get("cachedUser", null);
      return user;
    } catch (error) {
      console.error("[Auth] Failed to get cached user:", error);
      return null;
    }
  });

  /**
   * ローカルのユーザー情報をクリア（ログアウト時）
   */
  ipcMain.handle("clear-cached-user", async () => {
    try {
      store.delete("cachedUser");
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });
}
