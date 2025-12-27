import React, { ReactNode } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// モックの設定
const mockInvoke = jest.fn();

Object.defineProperty(window, "electron", {
  value: {
    ipc: {
      invoke: mockInvoke,
    },
  },
  writable: true,
});

import useGetSavedLibraryInfo from "@/hooks/data/useGetSavedLibraryInfo";

// wrapper を作成する関数
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useGetSavedLibraryInfo", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("保存されたライブラリ情報を正常に取得する", async () => {
    const mockLibraryInfo = {
      exists: true,
      directoryPath: "/music/library",
      fileCount: 100,
      lastScan: "2025-12-27T10:00:00.000Z",
      directoryExists: true,
    };

    mockInvoke.mockResolvedValueOnce(mockLibraryInfo);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useGetSavedLibraryInfo(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.libraryInfo).toEqual(mockLibraryInfo);
    expect(mockInvoke).toHaveBeenCalledWith("handle-get-saved-music-library");
  });

  it("ライブラリが存在しない場合", async () => {
    const mockLibraryInfo = {
      exists: false,
    };

    mockInvoke.mockResolvedValueOnce(mockLibraryInfo);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useGetSavedLibraryInfo(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.libraryInfo?.exists).toBe(false);
  });

  it("エラーが発生した場合", async () => {
    mockInvoke.mockResolvedValueOnce({
      error: "ライブラリ情報の取得に失敗しました",
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useGetSavedLibraryInfo(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
  });
});
