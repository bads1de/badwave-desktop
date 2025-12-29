import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import useGetTopPlayedSongs from "@/hooks/data/useGetTopPlayedSongs";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";
import React from "react";

// モックの設定
jest.mock("@/hooks/utils/useNetworkStatus");
jest.mock("react-hot-toast");

// Supabaseクライアントのモック
const mockSupabase = {
  rpc: jest.fn(),
};

jest.mock("@/libs/supabase/client", () => ({
  createClient: jest.fn(() => mockSupabase),
}));

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

describe("useGetTopPlayedSongs (Offline Support)", () => {
  const mockUseNetworkStatus = useNetworkStatus as jest.Mock;

  const mockUserId = "test-user-id";
  const mockSongs = [
    { id: "1", title: "Top Song 1", play_count: 100 },
    { id: "2", title: "Top Song 2", play_count: 50 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("オンライン時はRPCから再生数トップの曲を取得する", async () => {
    mockSupabase.rpc.mockResolvedValue({
      data: mockSongs,
      error: null,
    });

    mockUseNetworkStatus.mockReturnValue({ isOnline: true });

    const { result } = renderHook(() => useGetTopPlayedSongs(mockUserId), {
      wrapper: createWrapper(),
    });

    await waitFor(
      () => {
        expect(result.current.topSongs).toEqual(mockSongs);
      },
      { timeout: 10000 }
    );
  });
});

