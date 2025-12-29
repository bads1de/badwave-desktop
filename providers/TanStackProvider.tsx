"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { CACHE_CONFIG } from "@/constants";
import { electronAPI } from "@/libs/electron-utils";

interface Props {
  children: React.ReactNode;
}

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

  if (!persister) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}
    >
      {children}
    </PersistQueryClientProvider>
  );
};

export default TanStackProvider;
