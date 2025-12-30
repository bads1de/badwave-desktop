import { act } from "@testing-library/react";
import usePlaybackRateStore from "@/hooks/stores/usePlaybackRateStore";

describe("usePlaybackRateStore", () => {
  beforeEach(() => {
    // Reset store state before each test
    act(() => {
      usePlaybackRateStore.setState({
        rate: 1.0,
        hasHydrated: false,
      });
    });
  });

  it("should have initial state", () => {
    const state = usePlaybackRateStore.getState();
    expect(state.rate).toBe(1.0);
    expect(state.hasHydrated).toBe(false);
  });

  it("should set rate", () => {
    act(() => {
      usePlaybackRateStore.getState().setRate(1.5);
    });
    expect(usePlaybackRateStore.getState().rate).toBe(1.5);
  });

  it("should range check rate if needed (though store currently allows any number)", () => {
    act(() => {
      usePlaybackRateStore.getState().setRate(2.0);
    });
    expect(usePlaybackRateStore.getState().rate).toBe(2.0);

    act(() => {
      usePlaybackRateStore.getState().setRate(0.5);
    });
    expect(usePlaybackRateStore.getState().rate).toBe(0.5);
  });

  it("should set hasHydrated", () => {
    act(() => {
      usePlaybackRateStore.getState().setHasHydrated(true);
    });
    expect(usePlaybackRateStore.getState().hasHydrated).toBe(true);
  });
});
