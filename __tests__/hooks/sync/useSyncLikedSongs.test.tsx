import { renderHook, act, waitFor } from "@testing-library/react";
import { useSyncLikedSongs } from "@/hooks/sync/useSyncLikedSongs";
import { useUser } from "@/hooks/auth/useUser";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";
import { electronAPI } from "@/libs/electron/index";
import { createClient } from "@/libs/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mocking dependencies
jest.mock("@/hooks/auth/useUser");
jest.mock("@/hooks/utils/useNetworkStatus");
jest.mock("@/libs/electron");
jest.mock("@/libs/supabase/client");
jest.mock("@tanstack/react-query", () => {
  const original = jest.requireActual("@tanstack/react-query");
  return {
    ...original,
    useQueryClient: jest.fn(),
  };
});

describe("useSyncLikedSongs", () => {
  let queryClient: any;

  beforeEach(() => {
    queryClient = {
      invalidateQueries: jest.fn().mockResolvedValue(undefined),
    };
    (useQueryClient as jest.Mock).mockReturnValue(queryClient);
    (useUser as jest.Mock).mockReturnValue({ user: { id: "user-1" } });
    (useNetworkStatus as jest.Mock).mockReturnValue({ isOnline: true });
    (electronAPI.isElectron as jest.Mock).mockReturnValue(true);
    (electronAPI.cache.syncLikedSongs as jest.Mock).mockResolvedValue({
      success: true,
    });
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={new QueryClient()}>
      {children}
    </QueryClientProvider>
  );

  it("should initialize with isSyncing false", () => {
    const { result } = renderHook(
      () => useSyncLikedSongs({ autoSync: false }),
      { wrapper }
    );
    expect(result.current.isSyncing).toBe(false);
  });

  it("should set isSyncing to true during sync", async () => {
    // Mocking Supabase
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest
        .fn()
        .mockResolvedValue({ data: [{ songs: { id: "1" } }], error: null }),
    };
    (createClient as jest.Mock).mockReturnValue(mockSupabase);

    const { result } = renderHook(
      () => useSyncLikedSongs({ autoSync: false }),
      { wrapper }
    );

    let syncPromise: any;
    act(() => {
      syncPromise = result.current.sync();
    });

    // Wait for the next tick to allow isSyncing to update
    await waitFor(() => {
      expect(result.current.isSyncing).toBe(true);
    });

    await act(async () => {
      await syncPromise;
    });

    await waitFor(() => {
      expect(result.current.isSyncing).toBe(false);
    });
    
    expect(queryClient.invalidateQueries).toHaveBeenCalled();
  });
});
