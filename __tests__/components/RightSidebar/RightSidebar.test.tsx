import React from "react";
import { render, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import RightSidebar from "@/components/RightSidebar/RightSidebar";
import usePlayer from "@/hooks/player/usePlayer";
import useGetSongById from "@/hooks/data/useGetSongById";
import { store } from "@/libs/electron-utils";
import { ELECTRON_STORE_KEYS } from "@/constants";

// モックの設定
jest.mock("@/hooks/player/usePlayer");
jest.mock("@/hooks/data/useGetSongById");
jest.mock("@/libs/electron-utils", () => ({
  store: {
    get: jest.fn(),
    set: jest.fn(),
  },
  isElectron: jest.fn(() => true),
  electronAPI: {
    isElectron: jest.fn(() => true),
    offline: {
      checkStatus: jest.fn().mockResolvedValue({ isDownloaded: false }),
    },
    store: {
      get: jest.fn(),
      set: jest.fn(),
    },
  },
}));

// use-gestureのモック
jest.mock("@use-gesture/react", () => ({
  useDrag: jest.fn(() => () => ({})),
}));

const mockUsePlayer = usePlayer as jest.MockedFunction<typeof usePlayer>;
const mockUseGetSongById = useGetSongById as jest.MockedFunction<
  typeof useGetSongById
>;
const mockStore = store as jest.Mocked<typeof store>;

describe("RightSidebar - Close Feature", () => {
  const mockSong = {
    id: "song-1",
    title: "Test Song",
    author: "Test Artist",
    image_path: "/test.jpg",
    video_path: "/test.mp4",
  };

  const mockNextSong = {
    id: "song-2",
    title: "Next Song",
    author: "Next Artist",
    image_path: "/next.jpg",
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockUsePlayer.mockReturnValue({
      activeId: "song-1",
      getNextSongId: () => "song-2",
      getLocalSong: () => null,
    } as any);

    mockStore.get.mockResolvedValue(null);
    mockStore.set.mockResolvedValue(true);
  });

  describe("Sidebar State Persistence", () => {
    it("should load saved closed state on initial render", async () => {
      mockStore.get.mockImplementation((key: string) => {
        if (key === ELECTRON_STORE_KEYS.RIGHT_SIDEBAR_CLOSED) {
          return Promise.resolve(true);
        }
        return Promise.resolve(null);
      });

      mockUseGetSongById.mockReturnValue({
        song: mockSong,
        isLoading: false,
        error: null,
      } as any);

      render(
        <RightSidebar>
          <div>Main Content</div>
        </RightSidebar>
      );

      await waitFor(() => {
        expect(mockStore.get).toHaveBeenCalledWith(
          ELECTRON_STORE_KEYS.RIGHT_SIDEBAR_CLOSED
        );
      });
    });

    it("should save closed state when sidebar is closed", async () => {
      mockUseGetSongById.mockReturnValue({
        song: mockSong,
        isLoading: false,
        error: null,
      } as any);

      render(
        <RightSidebar>
          <div>Main Content</div>
        </RightSidebar>
      );

      await waitFor(() => {
        expect(mockStore.set).toHaveBeenCalled();
      });
    });
  });

  describe("Toggle Functionality", () => {
    it("should render toggle button when sidebar is closed", async () => {
      mockStore.get.mockImplementation((key: string) => {
        if (key === ELECTRON_STORE_KEYS.RIGHT_SIDEBAR_CLOSED) {
          return Promise.resolve(true);
        }
        return Promise.resolve(null);
      });

      mockUseGetSongById.mockReturnValue({
        song: mockSong,
        isLoading: false,
        error: null,
      } as any);

      const { container } = render(
        <RightSidebar>
          <div>Main Content</div>
        </RightSidebar>
      );

      await waitFor(() => {
        const toggleElement = container.querySelector(
          '[data-testid="sidebar-toggle"]'
        );
        expect(toggleElement).toBeInTheDocument();
      });
    });
  });
});
