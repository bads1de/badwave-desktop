import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import useGetPlaylistSongs from "@/hooks/data/useGetPlaylistSongs";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";
import React from "react";

// モックの設定
jest.mock("@/hooks/utils/useNetworkStatus");
jest.mock("@/libs/electron-utils", () => ({
  electronAPI: {
    isElectron: jest.fn(() => true),
    cache: {
      syncPlaylistSongs: jest.fn().mockResolvedValue({ success: true }),
      getCachedPlaylistSongs: jest.fn().mockResolvedValue([]),
    },
  },
}));

// Supabaseクライアントのモック
const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest
    .fn()
    .mockImplementation(() => Promise.resolve({ data: [], error: null })),
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

describe("useGetPlaylistSongs (Offline Support)", () => {
  const mockUseNetworkStatus = useNetworkStatus as jest.Mock;

  const mockPlaylistId = "test-playlist-id";
  const mockSongs = [{ id: "1", title: "Playlist Offline Song" }];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("オンライン時はAPIからプレイリストの曲を取得する", async () => {
    mockSupabase.order.mockResolvedValue({
      data: [{ songs: mockSongs[0] }],
      error: null,
    });

    mockUseNetworkStatus.mockReturnValue({ isOnline: true });

    const { result } = renderHook(() => useGetPlaylistSongs(mockPlaylistId), {
      wrapper: createWrapper(),
    });

    await waitFor(
      () => {
        expect(result.current.songs).toHaveLength(1);
        expect(result.current.songs[0].title).toBe("Playlist Offline Song");
      },
      { timeout: 10000 }
    );
  });
});