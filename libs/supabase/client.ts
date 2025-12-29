import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabaseクライアントを作成する関数
 *
 * 注: タブフォーカス時の再フェッチを防ぐ設定は、ここではなく
 * data fetching ライブラリ（TanStack Queryなど）側で行うのが適切です。
 * ここで stopAutoRefresh() を行うと、セッションの有効期限が切れた際に
 * 自動更新されず、ログアウトしてしまう可能性があります。
 *
 * @see https://supabase.com/docs/guides/auth/server-side/creating-a-client
 */
export function createClient() {
  // 通常のクライアントを作成
  const client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  return client;
}
