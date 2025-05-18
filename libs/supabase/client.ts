import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabaseクライアントを作成する関数
 *
 * タブフォーカス時の自動セッション更新を無効化するための実装を行っています。
 * これにより、タブを非アクティブから再度アクティブにした際に、
 * ページ全体が再フェッチされることを防ぎ、プレイヤーの再生位置がリセットされる問題を解消します。
 *
 * @see https://github.com/supabase/ssr/blob/main/src/createBrowserClient.ts
 * @see https://supabase.com/docs/guides/auth/server-side/creating-a-client
 */
export function createClient() {
  // 通常のクライアントを作成
  const client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 自動セッション更新を停止
  // https://supabase.com/docs/reference/javascript/auth-stopautorefresh
  client.auth.stopAutoRefresh();
  return client;
}
