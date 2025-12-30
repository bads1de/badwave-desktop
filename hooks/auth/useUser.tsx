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
import { electronAPI } from "@/libs/electron/index";
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
   * キャッシュからの復元を最優先し、その後最新の状態を確認
   */
  useEffect(() => {
    const initializeSession = async () => {
      // 1. まず Electron キャッシュからユーザーを復元 (最優先)
      if (electronAPI.isElectron() && isInitialized) {
        try {
          const cachedUser = await electronAPI.auth.getCachedUser();
          if (cachedUser) {
            const partialUser = {
              id: cachedUser.id,
              email: cachedUser.email,
              user_metadata: { avatar_url: cachedUser.avatarUrl },
            } as unknown as User;
            setUser(partialUser);
            // キャッシュがあれば一旦ロード完了とする（後で getSession が更新する）
            setIsSessionLoading(false);
          }
        } catch (e) {
          console.error("Failed to load cached user:", e);
        }
      }

      // 2. オンライン時: Supabase から最新セッションを取得して同期
      if (isOnline && isInitialized) {
        try {
          const { data } = await supabase.auth.getSession();
          const session = data.session;
          setSession(session);
          setUser(session?.user ?? null);

          // 最新情報をキャッシュに保存
          if (electronAPI.isElectron() && session?.user) {
            const u = session.user;
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
      } else if (!isOnline && isInitialized) {
        setIsSessionLoading(false);
      }
    };

    initializeSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (electronAPI.isElectron() && session?.user) {
        const u = session.user;
        electronAPI.auth.saveCachedUser({
          id: u.id,
          email: u.email,
          avatarUrl: u.user_metadata?.avatar_url,
        });
      }

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
        // オフラインなどで取得できない場合は null を返す（エラーを投げるとリトライが走る）
        return null;
      }

      return data as UserDetails;
    },
    enabled: !!user,
    staleTime: CACHE_CONFIG.staleTime,
    gcTime: CACHE_CONFIG.gcTime,
  });

  const value = {
    accessToken: session?.access_token ?? null,
    user,
    userDetails: userDetails ?? null,
    // userDetails のロードは UI をブロックしないように isLoading から外す
    isLoading: isSessionLoading,
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
