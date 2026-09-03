/**
 * @jest-environment jsdom
 */
import { renderHook, act } from "@testing-library/react";
import { createPersistedStore } from "@/hooks/utils/createPersistedStore";

// Mock zustand persist middleware
jest.mock("zustand/middleware", () => ({
  persist: (config: any, options: any) => (set: any, get: any, api: any) => {
    const baseState = config(set, get, api);
    return {
      ...baseState,
      _persist: { rehydrate: jest.fn(), onFinishHydration: jest.fn() },
    };
  },
}));

describe("createPersistedStore", () => {
  it("should create a store with initial state and hasHydrated", () => {
    const useTestStore = createPersistedStore<{
      value: string;
      setValue: (v: string) => void;
    }>(
      (set) => ({
        value: "initial",
        setValue: (v: string) => set({ value: v } as any),
      }),
      "test-store"
    );

    const { result } = renderHook(() => useTestStore());
    expect(result.current.value).toBe("initial");
    expect(result.current.hasHydrated).toBeDefined();
  });

  it("should update state when setter is called", () => {
    const useTestStore = createPersistedStore<{
      count: number;
      increment: () => void;
    }>(
      (set) => ({
        count: 0,
        increment: () => set({ count: 1 } as any),
      }),
      "test-counter"
    );

    const { result } = renderHook(() => useTestStore());

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });

  it("should set hasHydrated to true after rehydration", () => {
    const useTestStore = createPersistedStore(
      (set) => ({
        x: 1,
      }),
      "test-hydrate"
    );

    const { result } = renderHook(() => useTestStore());

    act(() => {
      result.current.setHasHydrated(true);
    });

    expect(result.current.hasHydrated).toBe(true);
  });
});
