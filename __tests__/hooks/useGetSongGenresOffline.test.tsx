import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import useGetSongsByGenres from "@/hooks/data/useGetSongGenres";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";
import React from "react";

// モックの設定
jest.mock("@/hooks/utils/useNetworkStatus");

// Supabaseクライアントのモック
const mockSelect = jest.fn().mockReturnThis();
const mockOr = jest.fn().mockReturnThis();
const mockNeq = jest.fn().mockReturnThis();
const mockLimit = jest
  .fn()
  .mockImplementation(() => Promise.resolve({ data: [], error: null }));

const mockSupabase = {
  from: jest.fn(() => ({
    select: mockSelect,
    or: mockOr,
    neq: mockNeq,
    limit: mockLimit,
  })),
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

describe("useGetSongsByGenres (Offline Support)", () => {
  const mockUseNetworkStatus = useNetworkStatus as jest.Mock;

  const mockGenres = ["Pop", "Rock"];
  const mockSongs = [{ id: "1", title: "Genre Song", genre: "Pop" }];

  beforeEach(() => {
    jest.clearAllMocks();

    // Supabaseのチェーンメソッドのモックをリセット
    mockSelect.mockReturnThis();
    mockOr.mockReturnThis();
    mockNeq.mockReturnThis();
  });

  it("オンライン時はAPIからジャンル一致曲を取得する", async () => {
    mockLimit.mockResolvedValue({
      data: mockSongs,
      error: null,
    });

    mockUseNetworkStatus.mockReturnValue({ isOnline: true });

    const { result } = renderHook(() => useGetSongsByGenres(mockGenres), {
      wrapper: createWrapper(),
    });

    await waitFor(
      () => {
        expect(result.current.songGenres).toEqual(mockSongs);
      },
      { timeout: 10000 }
    );
  });
});