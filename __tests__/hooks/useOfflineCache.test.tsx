import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useOfflineCache } from "@/hooks/utils/useOfflineCache";
import React from "react";

// electron store のモック
const mockElectronStore = {
  get: jest.fn(),
  set: jest.fn(),
};

// window.electron のモックを上書き
beforeEach(() => {
  Object.defineProperty(window, "electron", {
    value: {
      ...window.electron,
      store: mockElectronStore,
    },
    writable: true,
    configurable: true,
  });
  jest.clearAllMocks();
});

// テスト用のラッパー
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useOfflineCache", () => {
  describe("saveToCache", () => {
    it("データをelectron-storeに保存できる", async () => {
      const { result } = renderHook(() => useOfflineCache(), {
        wrapper: createWrapper(),
      });

      const testKey = "test-songs";
      const testData = [{ id: 1, title: "Test Song" }];

      await result.current.saveToCache(testKey, testData);

      expect(mockElectronStore.set).toHaveBeenCalledWith(
        expect.stringContaining(testKey),
        expect.objectContaining({
          data: testData,
          timestamp: expect.any(Number),
        })
      );
    });

    it("保存時にタイムスタンプが付与される", async () => {
      const { result } = renderHook(() => useOfflineCache(), {
        wrapper: createWrapper(),
      });

      const now = Date.now();
      jest.spyOn(Date, "now").mockReturnValue(now);

      await result.current.saveToCache("test-key", { test: "data" });

      expect(mockElectronStore.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          timestamp: now,
        })
      );

      jest.restoreAllMocks();
    });
  });

  describe("loadFromCache", () => {
    it("キャッシュからデータを読み込める", async () => {
      const testData = { songs: [{ id: 1, title: "Cached Song" }] };
      mockElectronStore.get.mockResolvedValue({
        data: testData,
        timestamp: Date.now(),
      });

      const { result } = renderHook(() => useOfflineCache(), {
        wrapper: createWrapper(),
      });

      const cached = await result.current.loadFromCache("test-key");

      expect(cached).toEqual(testData);
    });

    it("キャッシュが存在しない場合はnullを返す", async () => {
      mockElectronStore.get.mockResolvedValue(undefined);

      const { result } = renderHook(() => useOfflineCache(), {
        wrapper: createWrapper(),
      });

      const cached = await result.current.loadFromCache("non-existent-key");

      expect(cached).toBeNull();
    });

    it("有効期限切れのキャッシュはnullを返す", async () => {
      const expiredTimestamp = Date.now() - 1000 * 60 * 60 * 25; // 25時間前
      mockElectronStore.get.mockResolvedValue({
        data: { old: "data" },
        timestamp: expiredTimestamp,
      });

      const { result } = renderHook(() => useOfflineCache(), {
        wrapper: createWrapper(),
      });

      // デフォルトの有効期限は24時間
      const cached = await result.current.loadFromCache("expired-key");

      expect(cached).toBeNull();
    });

    it("カスタム有効期限を指定できる", async () => {
      const recentTimestamp = Date.now() - 1000 * 60 * 30; // 30分前
      mockElectronStore.get.mockResolvedValue({
        data: { recent: "data" },
        timestamp: recentTimestamp,
      });

      const { result } = renderHook(() => useOfflineCache(), {
        wrapper: createWrapper(),
      });

      // 1時間の有効期限を指定
      const cached = await result.current.loadFromCache("recent-key", {
        maxAge: 1000 * 60 * 60,
      });

      expect(cached).toEqual({ recent: "data" });
    });
  });

  describe("clearCache", () => {
    it("特定のキーのキャッシュを削除できる", async () => {
      const { result } = renderHook(() => useOfflineCache(), {
        wrapper: createWrapper(),
      });

      await result.current.clearCache("test-key");

      expect(mockElectronStore.set).toHaveBeenCalledWith(
        expect.stringContaining("test-key"),
        null
      );
    });
  });

  describe("isCacheValid", () => {
    it("有効なキャッシュが存在する場合はtrueを返す", async () => {
      mockElectronStore.get.mockResolvedValue({
        data: { valid: "data" },
        timestamp: Date.now(),
      });

      const { result } = renderHook(() => useOfflineCache(), {
        wrapper: createWrapper(),
      });

      const isValid = await result.current.isCacheValid("valid-key");

      expect(isValid).toBe(true);
    });

    it("キャッシュが存在しない場合はfalseを返す", async () => {
      mockElectronStore.get.mockResolvedValue(undefined);

      const { result } = renderHook(() => useOfflineCache(), {
        wrapper: createWrapper(),
      });

      const isValid = await result.current.isCacheValid("invalid-key");

      expect(isValid).toBe(false);
    });
  });
});
