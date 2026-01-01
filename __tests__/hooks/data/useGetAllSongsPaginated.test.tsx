import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import useGetAllSongsPaginated from "@/hooks/data/useGetAllSongsPaginated";
import { electronAPI } from "@/libs/electron";
import React from "react";

// モック
jest.mock("@/libs/electron", () => ({
  electronAPI: {
    isElectron: jest.fn(),
    cache: {
      getSongsPaginated: jest.fn(),
      getSongsTotalCount: jest.fn(),
    },
  },
  isNetworkError: jest.fn(() => false),
}));

jest.mock("@/libs/supabase/client", () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        order: jest.fn(() => ({
          range: jest.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    })),
  })),
}));

const mockElectronAPI = electronAPI as jest.Mocked<typeof electronAPI>;

// テスト用のラッパー
const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useGetAllSongsPaginated", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Electron環境でローカルDBからページネーションデータを取得する", async () => {
    const mockSongs = [
      { id: "1", title: "Song 1", author: "Artist 1" },
      { id: "2", title: "Song 2", author: "Artist 2" },
    ];

    (mockElectronAPI.isElectron as jest.Mock).mockReturnValue(true);
    (mockElectronAPI.cache.getSongsPaginated as jest.Mock).mockResolvedValue(
      mockSongs
    );
    (mockElectronAPI.cache.getSongsTotalCount as jest.Mock).mockResolvedValue(
      50
    );

    const { result } = renderHook(() => useGetAllSongsPaginated(0, 24), {
      wrapper: createTestWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.songs).toEqual(mockSongs);
    expect(result.current.totalCount).toBe(50);
    expect(result.current.totalPages).toBe(3); // ceil(50/24) = 3
    expect(result.current.currentPage).toBe(0);
  });

  it("Electron環境で正しいoffsetとlimitでAPI呼び出しする", async () => {
    (mockElectronAPI.isElectron as jest.Mock).mockReturnValue(true);
    (mockElectronAPI.cache.getSongsPaginated as jest.Mock).mockResolvedValue(
      []
    );
    (mockElectronAPI.cache.getSongsTotalCount as jest.Mock).mockResolvedValue(
      0
    );

    const page = 2;
    const pageSize = 24;

    renderHook(() => useGetAllSongsPaginated(page, pageSize), {
      wrapper: createTestWrapper(),
    });

    await waitFor(() => {
      expect(mockElectronAPI.cache.getSongsPaginated).toHaveBeenCalledWith(
        48, // offset = 2 * 24
        24 // limit
      );
    });
  });

  it("曲がない場合は空配列を返す", async () => {
    (mockElectronAPI.isElectron as jest.Mock).mockReturnValue(true);
    (mockElectronAPI.cache.getSongsPaginated as jest.Mock).mockResolvedValue(
      []
    );
    (mockElectronAPI.cache.getSongsTotalCount as jest.Mock).mockResolvedValue(
      0
    );

    const { result } = renderHook(() => useGetAllSongsPaginated(0, 24), {
      wrapper: createTestWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.songs).toEqual([]);
    expect(result.current.totalCount).toBe(0);
    expect(result.current.totalPages).toBe(0);
  });
});
