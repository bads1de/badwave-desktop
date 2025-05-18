import { createClient } from "@/libs/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    // URLからコードを取得
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");

    if (!code) {
      console.error("認証コードがありません");
      // エラーページまたはホームページにリダイレクト
      return NextResponse.redirect(`${requestUrl.origin}?error=no_code`);
    }

    const supabase = await createClient();

    // codeを使用してセッションを交換
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("認証エラー:", error.message);
      // エラーページにリダイレクト
      return NextResponse.redirect(
        `${requestUrl.origin}?error=auth_error&message=${encodeURIComponent(
          error.message
        )}`
      );
    }

    // 認証成功時はホームページにリダイレクト
    return NextResponse.redirect(requestUrl.origin);
  } catch (error) {
    console.error("予期せぬエラーが発生しました:", error);

    // エラー情報を取得
    const errorMessage =
      error instanceof Error ? error.message : "不明なエラー";

    // エラーページにリダイレクト
    const requestUrl = new URL(request.url);
    return NextResponse.redirect(
      `${requestUrl.origin}?error=unexpected&message=${encodeURIComponent(
        errorMessage
      )}`
    );
  }
}
