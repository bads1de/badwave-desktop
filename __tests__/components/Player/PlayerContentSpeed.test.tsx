import React, { useRef } from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PlayerContent from "@/components/Player/PlayerContent";
import useAudioPlayer from "@/hooks/audio/useAudioPlayer";
import usePlaybackRateStore from "@/hooks/stores/usePlaybackRateStore";
import { Song, Playlist } from "@/types";

// Mock hooks
jest.mock("@/hooks/audio/useAudioPlayer");
jest.mock("@/hooks/stores/useLyricsStore", () => ({
  __esModule: true,
  default: () => ({ toggleLyrics: jest.fn() }),
}));
jest.mock("@/hooks/stores/useEqualizerStore", () => ({
  __esModule: true,
  default: () => false, // isEnabled
}));
jest.mock("@/hooks/audio/useAudioEqualizer", () => ({
  __esModule: true,
  default: () => {},
}));
jest.mock("@/libs/electron", () => ({
  mediaControls: {
    onMediaControl: jest.fn(() => () => {}),
  },
}));

// Mock components to avoid rendering full tree
jest.mock("@/components/LikeButton", () => ({
  __esModule: true,
  default: () => <button data-testid="like-button">Like</button>,
}));
jest.mock("@/components/Song/MediaItem", () => ({
  __esModule: true,
  default: () => <div data-testid="media-item">Song Info</div>,
}));
jest.mock("@/components/Playlist/AddPlaylist", () => ({
  __esModule: true,
  default: () => <button data-testid="add-playlist">Add Playlist</button>,
}));
jest.mock("@/components/Equalizer/EqualizerControl", () => ({
  __esModule: true,
  default: () => <div data-testid="equalizer-control">Equalizer Control</div>,
}));

describe("PlayerContent Playback Speed", () => {
  const mockSong: Song = {
    id: "1",
    title: "Test Song",
    author: "Test Artist",
    song_path: "http://example.com/song.mp3",
    image_path: "http://example.com/image.jpg",
    user_id: "user1",
  };
  const mockPlaylists: Playlist[] = [];

  const mockUseAudioPlayer = useAudioPlayer as jest.Mock;

  beforeEach(() => {
    mockUseAudioPlayer.mockReturnValue({
      Icon: () => <span>Play</span>,
      VolumeIcon: () => <span>Volume</span>,
      formattedCurrentTime: "0:00",
      formattedDuration: "3:00",
      volume: 1,
      setVolume: jest.fn(),
      audioRef: { current: document.createElement("audio") }, // Ensure audioRef is provided
      currentTime: 0,
      duration: 180,
      isPlaying: false,
      isRepeating: false,
      isShuffling: false,
      handlePlay: jest.fn(),
      handleSeek: jest.fn(),
      onPlayNext: jest.fn(),
      onPlayPrevious: jest.fn(),
      toggleRepeat: jest.fn(),
      toggleShuffle: jest.fn(),
      handleVolumeClick: jest.fn(),
      showVolumeSlider: false,
      setShowVolumeSlider: jest.fn(),
    });

    // Reset store
    usePlaybackRateStore.setState({ rate: 1.0 });
  });

  it("should render playback speed button with default rate", () => {
    render(<PlayerContent song={mockSong} playlists={mockPlaylists} />);
    expect(screen.getByText("1x")).toBeInTheDocument();
  });

  it("should open popover and show options when clicked", async () => {
    render(<PlayerContent song={mockSong} playlists={mockPlaylists} />);

    // Using simple approach since Radix UI Popover might need more complex interaction mocks,
    // but verifying the trigger exists and mock clicks works.
    const trigger = screen.getByText("1x");
    fireEvent.click(trigger);

    // Verify options are rendered (assuming standard Popover behavior without too much mocking)
    // Note: Radix UI Popover renders into a portal, check if we can query it directly.
    // Testing library's screen.getByText searches the whole document body.
    expect(await screen.findByText("2x")).toBeInTheDocument();
    expect(screen.getByText("0.5x")).toBeInTheDocument();
  });

  it("should change playback rate when option is clicked", async () => {
    render(<PlayerContent song={mockSong} playlists={mockPlaylists} />);

    fireEvent.click(screen.getByText("1x"));

    const speed2x = await screen.findByText("2x");
    fireEvent.click(speed2x); // Just clicking the text might trigger the button if it's inside

    // Check if store updated
    expect(usePlaybackRateStore.getState().rate).toBe(2);
  });
});
