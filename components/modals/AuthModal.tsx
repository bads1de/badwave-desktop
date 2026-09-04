"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CHANNELS } from "@/electron/channels";
import useAuthModal from "@/hooks/auth/useAuthModal";
import Modal from "./Modal";
import { createClient } from "@/libs/supabase/client";
import Button from "@/components/common/Button";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import ja from "@/constants/ja.json";

interface Session {
  user: {
    id: string;
    email?: string;
  };
  access_token?: string;
}

const AuthModal = () => {
  const supabaseClient = createClient();
  const router = useRouter();
  const { onClose, isOpen } = useAuthModal();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // セッション状態を監視
  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabaseClient.auth.getSession();
      setSession(data.session);
    };

    getSession();

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabaseClient]);

  // セッションが存在する場合、モーダルを閉じる
  useEffect(() => {
    if (session) {
      router.refresh();
      onClose();
      setIsLoading(false);
    }
  }, [session, router, onClose]);

  // auth-callbackイベントを監視（Electron環境のみ）
  useEffect(() => {
    if (typeof window !== "undefined" && window.electron?.ipc) {
      const unsubscribe = window.electron.ipc.on(
        CHANNELS.AUTH_CALLBACK,
        async (data: { code?: string; error?: string }) => {
          if (data.error) {
            setError(data.error);
            setIsLoading(false);
          } else if (data.code) {
            try {
              // 認証コードをサーバーサイドAPIで交換してセッションを確立
              const isDev = process.env.NODE_ENV === "development";
              const baseUrl = isDev
                ? "http://localhost:3000"
                : window.location.origin;

              const response = await fetch(
                `${baseUrl}/api/auth/callback?code=${encodeURIComponent(data.code)}`
              );

              const result = await response.json();

              if (result.error) {
                throw new Error(result.error);
              }

              if (result.success && result.session) {
                // セッションを設定
                const { data: sessionData, error: sessionError } =
                  await supabaseClient.auth.setSession({
                    access_token: result.session.access_token,
                    refresh_token: result.session.refresh_token,
                  });

                if (sessionError) throw sessionError;

                setSession(sessionData.session);
              } else {
                throw new Error("セッション情報が見つかりません");
              }
            } catch (err: unknown) {
              setError(err instanceof Error ? err.message : "認証に失敗しました");
              setIsLoading(false);
            }
          }
        }
      );

      return () => {
        unsubscribe();
      };
    }
  }, [supabaseClient]);


  const onChange = (open: boolean) => {
    if (!open) {
      onClose();
      setIsLoading(false);
      setError(null);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const isElectron = typeof window !== "undefined" && window.electron?.auth;

      if (isElectron) {
        // Electron環境では外部ブラウザで認証
        // HTTPサーバーを使用してlocalhost:4321でコールバックを受け取る
        const { data, error } = await supabaseClient.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: "http://localhost:4321/auth/callback",
            skipBrowserRedirect: true,
          },
        });

        if (error) throw error;

        await window.electron!.auth.startGoogleOAuth(data.url);
      } else {
        // 非Electron環境では標準的なOAuthフロー
        const { data, error } = await supabaseClient.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/api/auth/callback`,
            skipBrowserRedirect: false,
          },
        });

        if (error) throw error;
      }
    } catch (err: unknown) {
      console.error("[Auth] Google login error:", err);
      setError(err instanceof Error ? err.message : "認証に失敗しました");
      setIsLoading(false);
    }
  };

  const isElectron = typeof window !== "undefined" && !!(window as { electron?: { auth?: unknown } }).electron?.auth;

  return (
    <Modal
      title="おかえりなさい"
      description="ログインしてください"
      isOpen={isOpen}
      onChange={onChange}
    >
      <div className="flex flex-col gap-4">
        {isElectron && (
          // Electron環境では外部ブラウザGoogleログインボタンを追加
          <>
            <Button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full bg-white text-black hover:bg-gray-100"
            >
              {isLoading ? "認証中... ブラウザを確認してください" : "Googleでログイン（外部ブラウザ）"}
            </Button>

            {error && (
              <div className="text-red-500 text-sm text-center">
                {error}
              </div>
            )}

            <div className="text-gray-400 text-xs text-center mt-2">
              ブラウザでGoogle認証が開きます
            </div>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-gray-600"></div>
              <span className="flex-shrink-0 mx-4 text-gray-400 text-xs">または</span>
              <div className="flex-grow border-t border-gray-600"></div>
            </div>
          </>
        )}

        <Auth
          theme="dark"
          magicLink
          providers={isElectron ? [] : ["google"]}
          localization={{
            variables: ja,
          }}
          supabaseClient={supabaseClient}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: "#404040",
                  brandAccent: "#4c1d95",
                },
              },
            },
          }}
          redirectTo={`${window.location.origin}/api/auth/callback`}
        />
      </div>
    </Modal>
  );
};

export default AuthModal;
