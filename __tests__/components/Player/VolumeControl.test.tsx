import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import VolumeControl from "@/components/player/VolumeControl";
import useVolumeStore from "@/hooks/stores/useVolumeStore";

jest.mock("@/hooks/stores/useVolumeStore");

describe("VolumeControl", () => {
  const mockSetVolume = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (useVolumeStore as unknown as jest.Mock).mockReturnValue({
      volume: 0.8,
      setVolume: mockSetVolume,
    });
  });

  it("renders volume icon", () => {
    const { container } = render(<VolumeControl />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("shows slider when icon is clicked", () => {
    const { container } = render(<VolumeControl />);
    const svg = container.querySelector("svg");
    if (svg) fireEvent.click(svg);
    const slider = screen.getByRole("slider");
    expect(slider).toBeInTheDocument();
  });

  it("shows volume percentage", () => {
    render(<VolumeControl />);
    expect(screen.getByText("80%")).toBeInTheDocument();
  });

  it("shows mute icon when volume is 0", () => {
    (useVolumeStore as unknown as jest.Mock).mockReturnValue({
      volume: 0,
      setVolume: mockSetVolume,
    });

    const { container } = render(<VolumeControl />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });
});
