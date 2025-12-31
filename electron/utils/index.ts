import { app } from "electron";
import * as path from "path";
import * as fs from "fs";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";

/**
 * file:// URLをローカルパスに変換するヘルパー
 * Node.jsの標準機能を使用してクロスプラットフォーム対応
 *
 * @param {string} fileUrl - 変換するファイルURL
 * @returns {string} ローカルファイルパス
 */
export const toLocalPath = (fileUrl: string): string => {
  try {
    // file:// プロトコルでない場合はそのまま返す
    if (!fileUrl.startsWith("file:")) {
      return fileUrl;
    }
    return fileURLToPath(fileUrl);
  } catch (e) {
    console.error(`Error converting file URL to path: ${fileUrl}`, e);
    return fileUrl;
  }
};

/**
 * .env.localファイルから環境変数を読み込む
 *
 * @returns {boolean} 環境変数の読み込みに成功したかどうか
 */
export function loadEnvVariables(): boolean {
  try {
    const envPath = path.join(app.getAppPath(), ".env.local");
    if (fs.existsSync(envPath)) {
      console.log("Loading environment variables from:", envPath);
      const envConfig = dotenv.parse(fs.readFileSync(envPath));
      for (const key in envConfig) {
        process.env[key] = envConfig[key];
      }
      return true;
    } else {
      console.warn(".env.localファイルが見つかりません:", envPath);
      return false;
    }
  } catch (error) {
    console.error("環境変数の読み込み中にエラーが発生しました:", error);
    return false;
  }
}

/**
 * 開発モードかどうかを判定
 */
export const isDev = !app.isPackaged;

/**
 * 条件付きでログを出力する
 * 開発モードの場合のみログを出力
 *
 * @param {string} message - ログメッセージ
 * @param {any[]} args - 追加の引数
 */
export function debugLog(message: string, ...args: any[]): void {
  if (isDev) {
    console.log(message, ...args);
  }
}
