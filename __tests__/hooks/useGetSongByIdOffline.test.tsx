import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import useGetSongById from "@/hooks/data/useGetSongById";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";
import { electronAPI } from "@/libs/electron/index";
import React from "react";

// モックの設定
jest.mock("@/hooks/utils/useNetworkStatus");
jest.mock("react-hot-toast");
jest.mock("@/libs/electron", () => ({
  isElectron: jest.fn(() => true),
  electronAPI: {
    isElectron: jest.fn(() => true),
    offline: {
      checkStatus: jest.fn().mockResolvedValue({ isDownloaded: false }),
      getSongs: jest.fn().mockResolvedValue([]),
    },
  },
}));

// Supabaseクライアントのモック
const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  maybeSingle: jest
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

describe("useGetSongById (Offline Support)", () => {
  const mockUseNetworkStatus = useNetworkStatus as jest.Mock;

  const mockSongId = "test-song-id";
  const mockSong = { id: mockSongId, title: "Offline Metadata Song" };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("オンライン時はAPIから曲情報を取得する", async () => {
    mockSupabase.maybeSingle.mockResolvedValue({
      data: mockSong,
      error: null,
    });

    mockUseNetworkStatus.mockReturnValue({ isOnline: true });

    const { result } = renderHook(() => useGetSongById(mockSongId), {
      wrapper: createWrapper(),
    });

    await waitFor(
      () => {
        expect(result.current.song).toEqual(mockSong);
      },
      { timeout: 10000 }
    );
  });

  it("ローカルにファイルが存在する場合はローカルパスを使用する", async () => {
    mockSupabase.maybeSingle.mockResolvedValue({
      data: mockSong,
      error: null,
    });
    mockUseNetworkStatus.mockReturnValue({ isOnline: true });

    // electronのモック拡張
    (electronAPI.offline.checkStatus as jest.Mock).mockResolvedValue({
      isDownloaded: true,
      localPath: "file://C:/Downloads/Song.mp3",
    });

    const { result } = renderHook(() => useGetSongById(mockSongId), {
      wrapper: createWrapper(),
    });

    await waitFor(
      () => {
        expect(result.current.song).toBeDefined();
        expect(result.current.song?.song_path).toBe(
          "file://C:/Downloads/Song.mp3"
        );
      },
      { timeout: 10000 }
    );
  });
});
