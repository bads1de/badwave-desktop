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
    // 開発時はプロジェクトルートの drizzle フォルダ
    // 本番（ビルド後）は適切な場所に配置される必要があるが、
    // 現状は開発環境での動作を優先してパスを設定。

    // electron/db/ 内に配置されるため、../../drizzle となる
    const migrationsFolder = path.join(__dirname, "../../drizzle");

    const db = getDb();

    migrate(db, {
      migrationsFolder,
    });
  } catch (error) {
    console.error("Error during migration:", error);
    throw error;
  }
}
