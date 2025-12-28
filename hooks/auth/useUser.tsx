/**
 * @fileoverview ユーザー認証状態を管理するためのカスタムフック
 *
 * オフライン対応: Electron環境ではローカルにキャッシュされたユーザー情報を使用
 */

import React, { useEffect, useState, createContext, useContext } from "react";
import { UserDetails } from "@/types";
import { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/libs/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";
import { electronAPI } from "@/libs/electron-utils";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";

type UserContextType = {
  accessToken: string | null;
  user: User | null;
  userDetails: UserDetails | null;
  isLoading: boolean;
};

export const UserContext = createContext<UserContextType | undefined>(
  undefined
);

export interface Props {
  [propName: string]: any;
}

export const MyUserContextProvider = (props: Props) => {
  const supabase = createClient();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const { isOnline, isInitialized } = useNetworkStatus();

  /**
   * セッション状態を監視するエフェクト
   * オンライン時: Supabase から取得
   * オフライン時: ローカルキャッシュから取得
   */
  useEffect(() => {
    const initializeSession = async () => {
      // Electron 環境でオフラインの場合、キャッシュからユーザーを復元
      if (electronAPI.isElectron() && !isOnline && isInitialized) {
        try {
          const cachedUser = await electronAPI.auth.getCachedUser();
          if (cachedUser) {
            // オフラインキャッシュから復元する部分的な User オブジェクト
            // 注意: 完全な User 型ではないが、アプリで必要な最小限のプロパティのみを持つ
            // 型安全性のため unknown を経由してキャスト
            const partialUser = {
              id: cachedUser.id,
              email: cachedUser.email,
              user_metadata: { avatar_url: cachedUser.avatarUrl },
            } as unknown as User;
            setUser(partialUser);
            setIsSessionLoading(false);
            return;
          }
        } catch (e) {
          console.error("Failed to load cached user:", e);
        }
      }

      // オンライン時: Supabase からセッションを取得
      try {
        const { data } = await supabase.auth.getSession();
        setSession(data.session);
        setUser(data.session?.user ?? null);

        // Electron 環境かつオンラインの場合、ユーザー情報をキャッシュ
        if (electronAPI.isElectron() && data.session?.user) {
          const u = data.session.user;
          electronAPI.auth.saveCachedUser({
            id: u.id,
            email: u.email,
            avatarUrl: u.user_metadata?.avatar_url,
          });
        }
      } catch (e) {
        console.error("Failed to get session:", e);
      } finally {
        setIsSessionLoading(false);
      }
    };

    if (isInitialized) {
      initializeSession();
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      // オンラインでログインしたらキャッシュを更新
      if (electronAPI.isElectron() && session?.user) {
        const u = session.user;
        electronAPI.auth.saveCachedUser({
          id: u.id,
          email: u.email,
          avatarUrl: u.user_metadata?.avatar_url,
        });
      }

      // ログアウト時はキャッシュをクリア
      if (!session && electronAPI.isElectron()) {
        electronAPI.auth.clearCachedUser();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, isOnline, isInitialized]);

  /**
   * ユーザー詳細情報をデータベースから取得するクエリ
   */
  const { data: userDetails, isLoading: isLoadingUserDetails } = useQuery({
    queryKey: [CACHED_QUERIES.userDetails, user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase.from("users").select("*").single();

      if (error) {
        throw new Error(`ユーザー情報の取得に失敗しました: ${error.message}`);
      }

      return data as UserDetails;
    },
    enabled: !!user && isOnline,
    staleTime: CACHE_CONFIG.staleTime,
    gcTime: CACHE_CONFIG.gcTime,
  });

  const value = {
    accessToken: session?.access_token ?? null,
    user,
    userDetails: userDetails ?? null,
    isLoading: isSessionLoading || (isOnline && isLoadingUserDetails),
  };

  return <UserContext.Provider value={value} {...props} />;
};

export const useUser = () => {
  const context = useContext(UserContext);

  if (context === undefined) {
    throw new Error("useUser must be used within a MyUserContextProvider");
  }

  return context;
};
