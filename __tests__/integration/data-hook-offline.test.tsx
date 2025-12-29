import { renderHook, act, waitFor } from "@testing-library/react";
import {
  QueryClient,
  QueryClientProvider,
  onlineManager,
} from "@tanstack/react-query";
import useGetTrendSongs from "@/hooks/data/useGetTrendSongs";
import { createClient } from "@/libs/supabase/client";
import React from "react";

jest.mock("@/libs/supabase/client");

describe("Debug Data Hook", () => {
  it("logs fetchStatus", async () => {
    onlineManager.setOnline(false);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { networkMode: "online", retry: false } },
    });

    const { result } = renderHook(() => useGetTrendSongs("all"), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

    // Small wait
    await new Promise((r) => setTimeout(r, 100));

    const state = queryClient.getQueryState(["trendSongs", "all"]);
    console.log("FINAL FETCH STATUS:", state?.fetchStatus);
    console.log("MANAGER IS ONLINE:", onlineManager.isOnline());
  });
});
