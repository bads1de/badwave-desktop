import { NextRequest, NextResponse } from "next/server";
import { PROTECTED_ROUTES } from "./constants";
import { updateSession } from "./libs/supabase/middleware";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  // セッションの更新
  const response = await updateSession(request);

  // Supabaseクライアントを再度作成してユーザー情報を取得
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 保護されたルートのパターンをチェック
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  // ユーザーが存在しない場合（未認証）で、保護されたルートにアクセスしようとした場合
  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  // PROTECTED_ROUTESの各ルートに対してマッチャーを生成
  matcher: ["/account/:path*", "/liked/:path*"],
};
