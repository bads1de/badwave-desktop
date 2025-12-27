import { renderHook, act } from "@testing-library/react";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";

describe("useNetworkStatus", () => {
  // オリジナルの navigator.onLine を保存
  const originalOnLine = navigator.onLine;

  // イベントリスナーを追跡
  let onlineHandler: EventListener | null = null;
  let offlineHandler: EventListener | null = null;

  beforeEach(() => {
    // navigator.onLine をモック可能にする
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      configurable: true,
      value: true,
    });

    // addEventListener をモック
    jest
      .spyOn(window, "addEventListener")
      .mockImplementation((event, handler) => {
        if (event === "online") {
          onlineHandler = handler as EventListener;
        } else if (event === "offline") {
          offlineHandler = handler as EventListener;
        }
      });

    // removeEventListener をモック
    jest.spyOn(window, "removeEventListener").mockImplementation(() => {});
  });

  afterEach(() => {
    // navigator.onLine を復元
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      configurable: true,
      value: originalOnLine,
    });

    onlineHandler = null;
    offlineHandler = null;
    jest.restoreAllMocks();
  });

  it("初期状態でオンラインの場合、isOnline は true を返す", () => {
    Object.defineProperty(navigator, "onLine", { value: true });

    const { result } = renderHook(() => useNetworkStatus());

    expect(result.current.isOnline).toBe(true);
  });

  it("初期状態でオフラインの場合、isOnline は false を返す", () => {
    Object.defineProperty(navigator, "onLine", { value: false });

    const { result } = renderHook(() => useNetworkStatus());

    expect(result.current.isOnline).toBe(false);
  });

  it("オフラインイベントが発生すると isOnline が false になる", () => {
    Object.defineProperty(navigator, "onLine", { value: true });

    const { result } = renderHook(() => useNetworkStatus());

    expect(result.current.isOnline).toBe(true);

    // オフラインイベントをシミュレート
    act(() => {
      if (offlineHandler) {
        offlineHandler(new Event("offline"));
      }
    });

    expect(result.current.isOnline).toBe(false);
  });

  it("オンラインイベントが発生すると isOnline が true になる", () => {
    Object.defineProperty(navigator, "onLine", { value: false });

    const { result } = renderHook(() => useNetworkStatus());

    expect(result.current.isOnline).toBe(false);

    // オンラインイベントをシミュレート
    act(() => {
      if (onlineHandler) {
        onlineHandler(new Event("online"));
      }
    });

    expect(result.current.isOnline).toBe(true);
  });

  it("アンマウント時にイベントリスナーが削除される", () => {
    const { unmount } = renderHook(() => useNetworkStatus());

    unmount();

    expect(window.removeEventListener).toHaveBeenCalledWith(
      "online",
      expect.any(Function)
    );
    expect(window.removeEventListener).toHaveBeenCalledWith(
      "offline",
      expect.any(Function)
    );
  });

  it("wasOffline は一度オフラインになった場合に true になる", () => {
    Object.defineProperty(navigator, "onLine", { value: true });

    const { result } = renderHook(() => useNetworkStatus());

    expect(result.current.wasOffline).toBe(false);

    // オフラインイベントをシミュレート
    act(() => {
      if (offlineHandler) {
        offlineHandler(new Event("offline"));
      }
    });

    expect(result.current.wasOffline).toBe(true);

    // オンラインに戻っても wasOffline は true のまま
    act(() => {
      if (onlineHandler) {
        onlineHandler(new Event("online"));
      }
    });

    expect(result.current.isOnline).toBe(true);
    expect(result.current.wasOffline).toBe(true);
  });
});
