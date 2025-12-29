import { app } from "electron";
import path from "path";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { getDb } from "./client";

/**
 * データベースのマイグレーションを実行する
 * electron/main.ts から呼び出される
 */
export async function runMigrations() {
  try {
    // 開発環境と本番環境でパスを切り替える
    // 開発時: プロジェクトルートの drizzle フォルダ (electron/db/ → ../../drizzle)
    // 本番時: extraResources で配置された resources/drizzle フォルダ
    const migrationsFolder = app.isPackaged
      ? path.join(process.resourcesPath, "drizzle")
      : path.join(__dirname, "../../drizzle");

    const db = getDb();

    migrate(db, {
      migrationsFolder,
    });
  } catch (error) {
    console.error("Error during migration:", error);
    throw error;
  }
}
