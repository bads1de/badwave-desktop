import { BrowserWindow, ipcMain, app } from "electron";
import { createClient } from "@supabase/supabase-js";
import * as path from "path";
import * as fs from "fs";
import * as dotenv from "dotenv";

// .env.localファイルを読み込む
const envPath = path.join(app.getAppPath(), ".env.local");
if (fs.existsSync(envPath)) {
  console.log("Loading environment variables from:", envPath);
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  for (const key in envConfig) {
    process.env[key] = envConfig[key];
  }
} else {
  console.warn(".env.localファイルが見つかりません:", envPath);
}

// 環境変数の確認
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase環境変数が設定されていません:");
  console.error("NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl);
  console.error(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY:",
    supabaseAnonKey ? "設定済み" : "未設定"
  );
}

// Supabaseクライアントの作成
const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "");

/**
 * Electronアプリでの認証処理を設定する
 * @param mainWindow メインウィンドウ
 */
export function setupAuth(mainWindow: BrowserWindow) {
  // ログインリクエストを処理
  ipcMain.handle("auth:signIn", async (event, { email, password }) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { data };
    } catch (error) {
      console.error("ログインエラー:", error);
      return { error };
    }
  });

  // サインアップリクエストを処理
  ipcMain.handle(
    "auth:signUp",
    async (event, { email, password, fullName }) => {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });

        if (error) throw error;
        return { data };
      } catch (error) {
        console.error("サインアップエラー:", error);
        return { error };
      }
    }
  );

  // ログアウトリクエストを処理
  ipcMain.handle("auth:signOut", async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error("ログアウトエラー:", error);
      return { error };
    }
  });

  // 現在のセッションを取得
  ipcMain.handle("auth:getSession", async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return { data };
    } catch (error) {
      console.error("セッション取得エラー:", error);
      return { error };
    }
  });

  // OAuth認証を処理
  ipcMain.handle("auth:signInWithOAuth", async (event, { provider }) => {
    try {
      // OAuthプロバイダーのURLを取得
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider as any,
        options: {
          redirectTo: "badwave://auth/callback",
        },
      });

      if (error) throw error;

      // 認証ウィンドウを作成
      const authWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
        },
        parent: mainWindow,
        modal: true,
      });

      // OAuthプロバイダーのURLに移動
      authWindow.loadURL(data.url);

      // ウィンドウが閉じられたときのハンドラー
      authWindow.on("closed", () => {
        // セッションを確認
        supabase.auth.getSession().then(({ data }) => {
          if (data.session) {
            mainWindow.webContents.send("auth:sessionUpdated", data);
          }
        });
      });

      return { success: true };
    } catch (error) {
      console.error("OAuth認証エラー:", error);
      return { error };
    }
  });
}
