import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import OfflinePage from "@/app/offline/page";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";
import { useRouter } from "next/navigation";
import { electronAPI } from "@/libs/electron/index";
import usePlayer from "@/hooks/player/usePlayer";

// Mock hooks and libraries
jest.mock("@/hooks/utils/useNetworkStatus");
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));
jest.mock("@/libs/electron", () => ({
  electronAPI: {
    isElectron: jest.fn(),
    offline: {
      getSongs: jest.fn(),
    },
  },
}));
jest.mock("@/hooks/player/usePlayer");

// Mock child components to verify integration
jest.mock(
  "@/components/Header/Header",
  () =>
    ({ children, className }: any) =>
      (
        <div data-testid="mock-header" className={className}>
          {children}
        </div>
      )
);

jest.mock("@/components/Song/SongItem", () => ({ data, onClick }: any) => (
  <div data-testid="mock-song-item" onClick={() => onClick(data.id)}>
    {data.title}
  </div>
));

describe("OfflinePage", () => {
  const mockUseNetworkStatus = useNetworkStatus as jest.Mock;
  const mockRouterPush = jest.fn();
  const mockIsElectron = electronAPI.isElectron as jest.Mock;
  const mockGetSongs = electronAPI.offline.getSongs as jest.Mock;

  const mockPlayer = {
    setId: jest.fn(),
    setIds: jest.fn(),
    setLocalSong: jest.fn(),
    activeId: undefined,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockRouterPush,
    });
    (usePlayer as unknown as jest.Mock).mockReturnValue(mockPlayer);
  });

  it("オンラインの場合はホームにリダイレクトする", () => {
    mockUseNetworkStatus.mockReturnValue({ isOnline: true });
    render(<OfflinePage />);
    expect(mockRouterPush).toHaveBeenCalledWith("/");
  });

  it("オフラインの場合はヘッダーとコンテンツを表示する", async () => {
    mockUseNetworkStatus.mockReturnValue({ isOnline: false });
    mockIsElectron.mockReturnValue(true);
    mockGetSongs.mockResolvedValue([]);

    render(<OfflinePage />);

    expect(screen.getByText("Offline Mode")).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByText("No downloaded songs found.")
      ).toBeInTheDocument();
    });
  });

  it("ダウンロード済みの曲を取得して表示する", async () => {
    const mockSongs = [
      { id: "song-1", title: "Offline Song 1", author: "Artist 1" },
      { id: "song-2", title: "Offline Song 2", author: "Artist 2" },
    ];

    mockUseNetworkStatus.mockReturnValue({ isOnline: false });
    mockIsElectron.mockReturnValue(true);
    mockGetSongs.mockResolvedValue(mockSongs);

    render(<OfflinePage />);

    await waitFor(() => {
      expect(screen.getAllByTestId("mock-song-item")).toHaveLength(2);
      expect(screen.getByText("Offline Song 1")).toBeInTheDocument();
      expect(screen.getByText("Offline Song 2")).toBeInTheDocument();
    });
  });

  it("曲をクリックした時にプレイヤーを更新して再生を開始する", async () => {
    const mockSongs = [
      { id: "song-1", title: "Offline Song 1", author: "Artist 1" },
    ];

    mockUseNetworkStatus.mockReturnValue({ isOnline: false });
    mockIsElectron.mockReturnValue(true);
    mockGetSongs.mockResolvedValue(mockSongs);

    render(<OfflinePage />);

    await waitFor(() => {
      expect(screen.getByText("Offline Song 1")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Offline Song 1"));

    // プレイヤーへのセットアップを検証
    expect(mockPlayer.setIds).toHaveBeenCalledWith(["song-1"]);
    expect(mockPlayer.setLocalSong).toHaveBeenCalledWith(mockSongs[0]);
    expect(mockPlayer.setId).toHaveBeenCalledWith("song-1");
  });
});
