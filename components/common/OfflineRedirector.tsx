"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";

const OfflineRedirector = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { isOnline } = useNetworkStatus();

  useEffect(() => {
    // If we are offline and NOT already on the offline page, redirect
    if (!isOnline && pathname !== "/offline") {
      router.push("/offline");
    }
    // Logic to return to home when online is handled in OfflinePage itself (or can be here too)
    // but the offline page already has a check.
  }, [isOnline, pathname, router]);

  return null;
};

export default OfflineRedirector;
