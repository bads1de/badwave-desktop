import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import useGetPlaylist from "@/hooks/data/useGetPlaylist";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";
import { useUser } from "@/hooks/auth/useUser";
import React from "react";

// モックの設定
jest.mock("@/hooks/utils/useNetworkStatus");
jest.mock("@/hooks/auth/useUser");
jest.mock("@/libs/electron-utils", () => ({
  electronAPI: {
    isElectron: jest.fn(() => true),
    auth: {
      getCachedUser: jest.fn().mockResolvedValue(null),
    },
    cache: {
      getCachedPlaylists: jest.fn().mockResolvedValue([]),
    },
  },
}));

// Supabaseクライアントのモック
const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest
    .fn()
    .mockImplementation(() => Promise.resolve({ data: null, error: null })),
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

describe("useGetPlaylist (Offline Support)", () => {
  const mockUseNetworkStatus = useNetworkStatus as jest.Mock;

  const mockPlaylistId = "test-playlist-id";
  const mockPlaylist = { id: mockPlaylistId, name: "Offline Playlist" };

  beforeEach(() => {
    jest.clearAllMocks();
    (useUser as jest.Mock).mockReturnValue({
      user: { id: "test-user-id" },
      userDetails: null,
      isLoading: false,
    });
  });

  it("オンライン時はAPIからプレイリスト情報を取得する", async () => {
    mockSupabase.single.mockResolvedValue({
      data: mockPlaylist,
      error: null,
    });

    mockUseNetworkStatus.mockReturnValue({ isOnline: true });

    const { result } = renderHook(() => useGetPlaylist(mockPlaylistId), {
      wrapper: createWrapper(),
    });

    await waitFor(
      () => {
        expect(result.current.playlist).toEqual(mockPlaylist);
      },
      { timeout: 10000 }
    );
  });
});