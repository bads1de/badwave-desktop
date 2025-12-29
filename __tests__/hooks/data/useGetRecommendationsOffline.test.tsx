import { renderHook, waitFor, act } from "@testing-library/react";
import {
  QueryClient,
  QueryClientProvider,
  onlineManager,
} from "@tanstack/react-query";
import useGetRecommendations from "@/hooks/data/useGetRecommendations";
import { createClient } from "@/libs/supabase/client";
import { useUser } from "@/hooks/auth/useUser";
import React from "react";

// モックの設定
jest.mock("@/libs/supabase/client");
jest.mock("@/hooks/auth/useUser");

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useGetRecommendations (Offline Support)", () => {
  const mockCreateClient = createClient as jest.Mock;
  const mockUseUser = useUser as jest.Mock;
  const mockUserId = "user-123";
  const mockSongs = [
    { id: "1", title: "Recommended Song 1", author: "Artist 1" },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    act(() => {
      onlineManager.setOnline(true);
    });
    mockUseUser.mockReturnValue({ user: { id: mockUserId } });
  });

  it("オンライン時はRPCメソッド get_recommendations を呼び出す", async () => {
    const mockRpc = jest
      .fn()
      .mockResolvedValue({ data: mockSongs, error: null });
    mockCreateClient.mockReturnValue({
      rpc: mockRpc,
    });

    const { result } = renderHook(() => useGetRecommendations(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.recommendations).toHaveLength(1);
    });

    expect(mockRpc).toHaveBeenCalledWith("get_recommendations", {
      p_user_id: mockUserId,
      p_limit: 10,
    });
  });

  it("オフライン時はクエリが一時停止される", async () => {
    // オフライン設定
    act(() => {
      onlineManager.setOnline(false);
    });

    const mockRpc = jest.fn();
    mockCreateClient.mockReturnValue({
      rpc: mockRpc,
    });

    const { result } = renderHook(() => useGetRecommendations(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isPaused).toBe(true);
    });

    // RPCが呼ばれていないことを確認
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("ユーザーがログインしていない場合はクエリが有効化されない", async () => {
    mockUseUser.mockReturnValue({ user: null });

    const { result } = renderHook(() => useGetRecommendations(), {
      wrapper: createWrapper(),
    });

    // ログインしていない場合は enabled: false になるため、fetchStatus は 'idle'
    expect(result.current.isLoading).toBe(false);
    expect(result.current.recommendations).toEqual([]);
  });
});
