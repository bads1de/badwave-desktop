"use client";

import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { CACHE_CONFIG } from "@/constants";
import { electronAPI } from "@/libs/electron-utils";
import {
  setupOnlineManager,
  setupFocusManager,
  setupMutationResume,
} from "@/libs/query-online-manager";

interface Props {
  children: React.ReactNode;
}

// 一度だけ実行するフラグ
let isManagersSetup = false;

const TanStackProvider = ({ children }: Props) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: CACHE_CONFIG.staleTime,
            gcTime: CACHE_CONFIG.gcTime,
            retry: false,
            refetchOnWindowFocus: false,
            // オフライン時はキャッシュから取得、失敗時は pause
            networkMode: "offlineFirst",
          },
          mutations: {
            // オフライン時は mutation を pause し、オンライン復帰時に再開
            networkMode: "offlineFirst",
          },
        },
      })
  );

  const [persister] = useState(() => {
    if (typeof window === "undefined") return null;

    // Electron Store (または web fallback) を使用した非同期パーシスター
    return createAsyncStoragePersister({
      storage: {
        getItem: async (key) => {
          const result = await electronAPI.store.get(key);
          return typeof result === "string" ? result : JSON.stringify(result);
        },
        setItem: async (key, value) => {
          await electronAPI.store.set(key, value);
        },
        removeItem: async (key) => {
          await electronAPI.store.set(key, null);
        },
      },
      key: "BADWAVE_QUERY_CACHE",
    });
  });

  // onlineManager と focusManager のセットアップ
  useEffect(() => {
    if (isManagersSetup) return;
    isManagersSetup = true;

    setupOnlineManager();
    setupFocusManager();
    const unsubscribe = setupMutationResume(queryClient);

    return () => {
      unsubscribe();
    };
  }, [queryClient]);

  if (!persister) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    );
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}
    >
      {children}
      {/* <ReactQueryDevtools initialIsOpen={false} /> */}
    </PersistQueryClientProvider>
  );
};

export default TanStackProvider;
