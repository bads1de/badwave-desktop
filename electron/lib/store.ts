import { app } from "electron";
import Store from "electron-store";

// 設定ストアの初期化
const store = new Store({
  name: "badwave-settings", // 設定ファイルの名前
  clearInvalidConfig: true, // 無効な設定を自動的にクリア
  cwd: app.getPath("userData"), // 開発モードでも同じ場所に保存するための設定
});

export default store;
