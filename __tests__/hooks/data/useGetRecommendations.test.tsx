/**
 * @jest-environment jsdom
 */
import React from "react";
import { renderHook, waitFor, act } from "@testing-library/react";
import {
  QueryClient,
  QueryClientProvider,
  onlineManager,
} from "@tanstack/react-query";
import useGetRecommendations from "@/hooks/data/useGetRecommendations";
import { useUser } from "@/hooks/auth/useUser";

// モック
jest.mock("@/hooks/auth/useUser");
const mockRpc = jest.fn();
jest.mock("@/libs/supabase/client", () => ({
  createClient: () => ({
    rpc: mockRpc,
  }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useGetRecommendations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    act(() => {
      onlineManager.setOnline(true);
    });
    (useUser as jest.Mock).mockReturnValue({ user: { id: "user-123" } });
    
    // Web環境をシミュレート
    if (window.electron) {
      window.electron.appInfo.isElectron = false;
    }
  });

  afterEach(() => {
    // Electron環境に戻す
    if (window.electron) {
      window.electron.appInfo.isElectron = true;
    }
  });

  it("ログインユーザーにおすすめ曲を返す", async () => {
    const mockData = [
      { id: "1", title: "Rec 1", author: "Artist 1" },
    ];
    mockRpc.mockResolvedValue({ data: mockData, error: null });

    const { result } = renderHook(() => useGetRecommendations(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.recommendations).toHaveLength(1);
    expect(mockRpc).toHaveBeenCalledWith("get_recommendations", {
      p_user_id: "user-123",
      p_limit: 10,
    });
  });

  it("未ログイン時は空配列を返す", async () => {
    (useUser as jest.Mock).mockReturnValue({ user: null });

    const { result } = renderHook(() => useGetRecommendations(), {
      wrapper: createWrapper(),
    });

    // query は enabled: !!user?.id なので、最初から isLoading: false かつ data: [] になるはず
    expect(result.current.recommendations).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });
});
