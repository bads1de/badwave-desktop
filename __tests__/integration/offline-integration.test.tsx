import { renderHook, act, waitFor } from "@testing-library/react";
import { onlineManager } from "@tanstack/react-query";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";
import { setupOnlineManager } from "@/libs/query-online-manager";
import { electronAPI } from "@/libs/electron/index";

describe("Network Status Integration Test", () => {
  const originalOnLine = navigator.onLine;

  beforeEach(() => {
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      configurable: true,
      value: true,
    });
    onlineManager.setOnline(true);
    setupOnlineManager();
  });

  afterEach(() => {
    Object.defineProperty(navigator, "onLine", { value: originalOnLine });
    onlineManager.setOnline(true);
  });

  it("should respond to window online/offline events", async () => {
    const { result } = renderHook(() => useNetworkStatus());

    expect(result.current.isOnline).toBe(true);

    // 1. オフラインイベント
    act(() => {
      window.dispatchEvent(new Event("offline"));
    });
    expect(result.current.isOnline).toBe(false);

    // 2. オンラインイベント (async because of Electron simulation check in setupOnlineManager)
    act(() => {
      window.dispatchEvent(new Event("online"));
    });

    await waitFor(() => {
      expect(result.current.isOnline).toBe(true);
    });
  });

  it("should respond to Electron IPC simulation events", async () => {
    const { result } = renderHook(() => useNetworkStatus());

    // IPC イベントをシミュレート
    const ipcOnMock = (window as any).electron.ipc.on;
    const callback = ipcOnMock.mock.calls.find(
      (call: any) => call[0] === "offline-simulation-changed"
    )[1];

    act(() => {
      callback(true); // isSimulatingOffline = true
    });
    expect(result.current.isOnline).toBe(false);

    act(() => {
      callback(false); // isSimulatingOffline = false
    });
    expect(result.current.isOnline).toBe(true);
  });
});
