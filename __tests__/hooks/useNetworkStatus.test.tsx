import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";
import { renderHook, act, waitFor } from "@testing-library/react";
import { onlineManager } from "@tanstack/react-query";

describe("useNetworkStatus (Refactored with onlineManager)", () => {
  beforeEach(() => {
    // 初期状態をオンラインに設定
    onlineManager.setOnline(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should reflect online state from onlineManager", async () => {
    const { result } = renderHook(() => useNetworkStatus());

    // 初期化を待つ
    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });

    expect(result.current.isOnline).toBe(true);

    // オフラインに切り替え
    act(() => {
      onlineManager.setOnline(false);
    });
    expect(result.current.isOnline).toBe(false);

    // オンラインに切り替え
    act(() => {
      onlineManager.setOnline(true);
    });
    expect(result.current.isOnline).toBe(true);
  });

  it("should track wasOffline", async () => {
    const { result } = renderHook(() => useNetworkStatus());

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });

    expect(result.current.wasOffline).toBe(false);

    // オフラインにする
    act(() => {
      onlineManager.setOnline(false);
    });
    expect(result.current.wasOffline).toBe(true);

    // オンラインに戻しても wasOffline は true のまま
    act(() => {
      onlineManager.setOnline(true);
    });
    expect(result.current.isOnline).toBe(true);
    expect(result.current.wasOffline).toBe(true);
  });
});
