import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import SongItem from "@/components/Song/SongItem";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";
import useDownloadSong from "@/hooks/utils/useDownloadSong";
import { Song } from "@/types";

// モックの設定
jest.mock("@/hooks/utils/useNetworkStatus");
jest.mock("@/hooks/utils/useDownloadSong");
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}));
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

describe("SongItem", () => {
  const mockData: Song = {
    id: "song-1",
    title: "Test Song",
    author: "Test Author",
    image_path: "/test-image.jpg",
    song_path: "/test-song.mp3",
    count: "100",
    like_count: "50",
    genre: "Pop",
    created_at: "2023-01-01",
    user_id: "user-1",
  };

  const mockOnClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useNetworkStatus as jest.Mock).mockReturnValue({
      isOnline: true,
      isInitialized: true,
    });
    (useDownloadSong as jest.Mock).mockReturnValue({
      isDownloaded: false,
    });
  });

  it("曲の情報が正しく表示される", () => {
    render(<SongItem data={mockData} onClick={mockOnClick} />);

    expect(screen.getByText("Test Song")).toBeInTheDocument();
    expect(screen.getByText("Test Author")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument(); // 再生回数
    expect(screen.getByText("50")).toBeInTheDocument(); // いいね数
  });

  it("クリックすると onClick が呼ばれる", () => {
    render(<SongItem data={mockData} onClick={mockOnClick} />);

    const item = screen.getByAltText("Image");
    fireEvent.click(item);

    expect(mockOnClick).toHaveBeenCalledWith(mockData.id);
  });

  it("オフラインかつダウンロードされていない場合は、再生不可のオーバーレイが表示される", () => {
    (useNetworkStatus as jest.Mock).mockReturnValue({
      isOnline: false,
      isInitialized: true,
    });
    (useDownloadSong as jest.Mock).mockReturnValue({
      isDownloaded: false,
    });

    render(<SongItem data={mockData} onClick={mockOnClick} />);

    expect(screen.getByText("オフライン時は再生不可")).toBeInTheDocument();

    // クリックしても onClick が呼ばれないことを確認
    const item = screen.getByAltText("Image");
    fireEvent.click(item);
    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it("オフラインでもダウンロード済みの場合は、再生可能である", () => {
    (useNetworkStatus as jest.Mock).mockReturnValue({
      isOnline: false,
      isInitialized: true,
    });
    (useDownloadSong as jest.Mock).mockReturnValue({
      isDownloaded: true,
    });

    render(<SongItem data={mockData} onClick={mockOnClick} />);

    expect(
      screen.queryByText("オフライン時は再生不可")
    ).not.toBeInTheDocument();

    // クリックしたら onClick が呼ばれる
    const item = screen.getByAltText("Image");
    fireEvent.click(item);
    expect(mockOnClick).toHaveBeenCalledWith(mockData.id);
  });
});
