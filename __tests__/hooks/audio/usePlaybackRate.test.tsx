import { renderHook, act } from "@testing-library/react";
import usePlaybackRate from "@/hooks/audio/usePlaybackRate";
import usePlaybackRateStore from "@/hooks/stores/usePlaybackRateStore";
import { useRef } from "react";

describe("usePlaybackRate", () => {
  let audioMock: HTMLAudioElement;
  let audioRef: React.RefObject<HTMLAudioElement>;

  beforeEach(() => {
    // Reset store
    act(() => {
      usePlaybackRateStore.setState({ rate: 1.0 });
    });

    // Mock Audio element
    audioMock = document.createElement("audio");
    jest.spyOn(audioMock, "playbackRate", "set");

    // Setup ref using a proper React ref object structure
    audioRef = { current: audioMock };
  });

  it("should set initial playback rate to audio element", () => {
    // Set initial store value
    act(() => {
      usePlaybackRateStore.setState({ rate: 1.5 });
    });

    renderHook(() => usePlaybackRate(audioRef));

    expect(audioMock.playbackRate).toBe(1.5);
  });

  it("should update audio playback rate when store changes", () => {
    renderHook(() => usePlaybackRate(audioRef));

    expect(audioMock.playbackRate).toBe(1.0);

    act(() => {
      usePlaybackRateStore.getState().setRate(2.0);
    });

    expect(audioMock.playbackRate).toBe(2.0);
  });

  it("should re-apply playback rate on durationchange event", () => {
    act(() => {
      usePlaybackRateStore.setState({ rate: 1.25 });
    });

    renderHook(() => usePlaybackRate(audioRef));

    // Simulate durationchange (e.g. source change resets rate)
    // Manually reset rate to simulate browser behavior
    audioMock.playbackRate = 1.0;

    act(() => {
      const event = new Event("durationchange");
      audioMock.dispatchEvent(event);
    });

    expect(audioMock.playbackRate).toBe(1.25);
  });
});
