import { app } from "electron";
import * as path from "path";
import * as fs from "fs";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { DbSongRow } from "../../types";

/**
 * file:// または badwave:// URLをローカルパスに変換するヘルパー
 *
 * @param {string} fileUrl - 変換するファイルURL
 * @returns {string} ローカルファイルパス
 */
export const toLocalPath = (fileUrl: string): string => {
  try {
    if (fileUrl.startsWith("badwave://")) {
      const urlObj = new URL(fileUrl);
      if (urlObj.hostname === "file") {
        return decodeURIComponent(urlObj.pathname.slice(1));
      }
      return fileUrl;
    }
    if (fileUrl.startsWith("file:")) {
      return fileURLToPath(fileUrl);
    }
    return fileUrl;
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
      debugLog("Loading environment variables from:", envPath);
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
 * IDを文字列に強制変換し、".0" などの浮動小数点表記を除去する
 *
 * @param id - 正規化するID
 * @returns 正規化された文字列ID
 */
export function normalizeId(id: string | number | null | undefined): string {
  if (id === null || id === undefined) return "";
  const s = String(id);
  return s.includes(".") ? s.split(".")[0] : s;
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
 * @param {unknown[]} args - 追加の引数
 */
export function debugLog(message: string, ...args: unknown[]): void {
  if (isDev) {
    console.log(message, ...args);
  }
}

/**
 * DBの songs テーブルレコードをレンダラープロセス向けのレスポンス形式に変換する
 *
 * cache.ts・offline.ts の複数箇所で重複していたマッピングロジックを共通化。
 *
 * @param song - DBから取得した songs テーブルのレコード
 * @param overrides - created_at など、呼び出し元ごとに異なるフィールドの上書き
 * @returns レンダラープロセス向けの Song レスポンスオブジェクト
 */
/**
 * 存在しない曲のフォールバックオブジェクトを生成する
 *
 * cache.ts の get-cached-liked-songs と get-cached-playlist-songs で
 * 重複していた Unknown Song オブジェクトを共通化。
 *
 * @param id - 曲ID
 * @param userId - ユーザーID
 * @param createdAt - 作成日時
 * @returns フォールバック用のSongレスポンスオブジェクト
 */
export function createUnknownSongFallback(
  id: string,
  userId: string,
  createdAt: string | null,
) {
  return {
    id,
    user_id: userId,
    title: "Unknown Title",
    author: "Unknown Author",
    song_path: null,
    image_path: null,
    video_path: null,
    is_downloaded: false,
    local_song_path: null,
    local_image_path: null,
    local_video_path: null,
    count: "0",
    like_count: "0",
    created_at: createdAt,
    duration: null,
    genre: null,
    lyrics: null,
  };
}

export function mapDbSongToResponse(
  song: DbSongRow,
  overrides?: {
    created_at?: string | null;
    user_id?: string;
  },
) {
  return {
    id: song.id,
    user_id: overrides?.user_id ?? song.userId ?? "",
    title: song.title,
    author: song.author,
    song_path: song.originalSongPath || null,
    image_path: song.originalImagePath || null,
    video_path: song.originalVideoPath || null,
    is_downloaded: !!song.songPath,
    local_song_path: song.songPath || null,
    local_image_path: song.imagePath || null,
    local_video_path: song.videoPath || null,
    duration: song.duration,
    genre: song.genre,
    count: String(song.playCount || 0),
    like_count: String(song.likeCount || 0),
    lyrics: song.lyrics || null,
    created_at: overrides?.created_at ?? song.createdAt ?? null,
  };
}
