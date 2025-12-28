"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";

const OfflineRedirector = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { isOnline } = useNetworkStatus();

  useEffect(() => {
    // スマートオフライン実装のため、強制リダイレクトは無効化します。
    // 代わりに各ページでグレーアウト等の処理を行います。
    /*
    if (!isOnline && pathname !== "/offline") {
      router.push("/offline");
    }
    */
  }, [isOnline, pathname, router]);

  return null;
};

export default OfflineRedirector;
