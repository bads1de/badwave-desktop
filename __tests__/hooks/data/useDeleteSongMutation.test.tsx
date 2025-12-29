import { renderHook, act, waitFor } from "@testing-library/react";
import useDeleteSongMutation from "@/hooks/mutations/useDeleteSongMutation";
import { createClient } from "@/libs/supabase/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import toast from "react-hot-toast";
import React from "react";

// Mock Supabase client
jest.mock("@/libs/supabase/client", () => ({
  createClient: jest.fn(),
}));

// Mock toast
jest.mock("react-hot-toast", () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: jest.fn(),
    push: jest.fn(),
  }),
}));

// Mock useUser
jest.mock("@/hooks/auth/useUser", () => ({
  useUser: () => ({
    user: { id: "test-user-id" },
  }),
}));

// Mock deleteFileFromR2
const mockDeleteFileFromR2 = jest.fn();
jest.mock("@/actions/r2", () => ({
  deleteFileFromR2: (...args: unknown[]) => mockDeleteFileFromR2(...args),
}));

// Mock checkIsAdmin
const mockCheckIsAdmin = jest.fn();
jest.mock("@/actions/checkAdmin", () => ({
  checkIsAdmin: () => mockCheckIsAdmin(),
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      mutations: {
        retry: false,
      },
      queries: {
        retry: false,
      },
    },
  });

describe("useDeleteSongMutation", () => {
  const mockSupabase = {
    from: jest.fn(),
  };

  beforeEach(() => {
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
    jest.clearAllMocks();
    mockDeleteFileFromR2.mockResolvedValue({ success: true });
    mockCheckIsAdmin.mockResolvedValue({ isAdmin: true });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={createTestQueryClient()}>
      {children}
    </QueryClientProvider>
  );

  it("正常に曲を削除できる", async () => {
    // Mock delete chain
    const mockDeletedSong = {
      id: 123,
      song_path: "https://example.com/songs/song-file.mp3",
      image_path: "https://example.com/images/image-file.jpg",
    };

    const mockSelect = jest
      .fn()
      .mockResolvedValue({ data: [mockDeletedSong], error: null });
    const mockEqId = jest.fn().mockReturnValue({ select: mockSelect });
    const mockEqUserId = jest.fn().mockReturnValue({ eq: mockEqId });
    const mockDelete = jest.fn().mockReturnValue({ eq: mockEqUserId });

    mockSupabase.from.mockReturnValue({ delete: mockDelete });

    const { result } = renderHook(() => useDeleteSongMutation(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ songId: "123" });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // DB削除が呼ばれたことを確認
    expect(mockDelete).toHaveBeenCalled();
    expect(mockEqUserId).toHaveBeenCalledWith("user_id", "test-user-id");
    expect(mockEqId).toHaveBeenCalledWith("id", 123);

    // R2からファイルが削除されたことを確認
    expect(mockDeleteFileFromR2).toHaveBeenCalledWith("song", "song-file.mp3");
    expect(mockDeleteFileFromR2).toHaveBeenCalledWith(
      "image",
      "image-file.jpg"
    );

    // 成功トーストが表示されたことを確認
    expect(toast.success).toHaveBeenCalledWith("削除しました");
  });

  it("データベース削除でエラーが発生した場合", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const mockSelect = jest.fn().mockResolvedValue({
      data: null,
      error: { message: "Database error" },
    });
    const mockEqId = jest.fn().mockReturnValue({ select: mockSelect });
    const mockEqUserId = jest.fn().mockReturnValue({ eq: mockEqId });
    const mockDelete = jest.fn().mockReturnValue({ eq: mockEqUserId });

    mockSupabase.from.mockReturnValue({ delete: mockDelete });

    const { result } = renderHook(() => useDeleteSongMutation(), { wrapper });

    await act(async () => {
      try {
        await result.current.mutateAsync({ songId: "123" });
      } catch (e) {}
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(toast.error).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("削除されたレコードがない場合", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const mockSelect = jest.fn().mockResolvedValue({
      data: [],
      error: null,
    });
    const mockEqId = jest.fn().mockReturnValue({ select: mockSelect });
    const mockEqUserId = jest.fn().mockReturnValue({ eq: mockEqId });
    const mockDelete = jest.fn().mockReturnValue({ eq: mockEqUserId });

    mockSupabase.from.mockReturnValue({ delete: mockDelete });

    const { result } = renderHook(() => useDeleteSongMutation(), { wrapper });

    await act(async () => {
      try {
        await result.current.mutateAsync({ songId: "123" });
      } catch (e) {}
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(toast.error).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("isPending状態が正しく管理される", async () => {
    const mockDeletedSong = {
      id: 123,
      song_path: "https://example.com/songs/song.mp3",
      image_path: "https://example.com/images/image.jpg",
    };

    const mockSelect = jest
      .fn()
      .mockResolvedValue({ data: [mockDeletedSong], error: null });
    const mockEqId = jest.fn().mockReturnValue({ select: mockSelect });
    const mockEqUserId = jest.fn().mockReturnValue({ eq: mockEqId });
    const mockDelete = jest.fn().mockReturnValue({ eq: mockEqUserId });

    mockSupabase.from.mockReturnValue({ delete: mockDelete });

    const { result } = renderHook(() => useDeleteSongMutation(), { wrapper });

    // 初期状態
    expect(result.current.isPending).toBe(false);

    await act(async () => {
      await result.current.mutateAsync({ songId: "123" });
    });

    // ミューテーション完了後
    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it("管理者でない場合はエラーになる", async () => {
    mockCheckIsAdmin.mockResolvedValue({ isAdmin: false });

    const { result } = renderHook(() => useDeleteSongMutation(), { wrapper });

    await act(async () => {
      try {
        await result.current.mutateAsync({ songId: "123" });
      } catch (e) {}
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(toast.error).toHaveBeenCalledWith("管理者権限が必要です");
  });
});
