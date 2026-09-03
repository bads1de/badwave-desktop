/**
 * @jest-environment jsdom
 */
import { renderHook, act } from "@testing-library/react";
import useSpotlightModal from "@/hooks/modal/useSpotlightModal";
import type { Spotlight } from "@/types";

jest.mock("@/types", () => ({}));

describe("useSpotlightModal", () => {
  const mockSpotlight: Spotlight = {
    id: "spot-1",
    title: "Test Spotlight",
    video_path: "/test.mp4",
    author: "Test Author",
    created_at: "2023-01-01",
  };

  it("should start closed with no selected item", () => {
    const { result } = renderHook(() => useSpotlightModal());
    expect(result.current.isOpen).toBe(false);
    expect(result.current.selectedItem).toBeNull();
  });

  it("should open and set selectedItem when onOpen is called", () => {
    const { result } = renderHook(() => useSpotlightModal());

    act(() => {
      result.current.onOpen(mockSpotlight);
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.selectedItem).toEqual(mockSpotlight);
  });

  it("should close and clear selectedItem when onClose is called", () => {
    const { result } = renderHook(() => useSpotlightModal());

    act(() => {
      result.current.onOpen(mockSpotlight);
    });
    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.onClose();
    });

    expect(result.current.isOpen).toBe(false);
    expect(result.current.selectedItem).toBeNull();
  });
});
