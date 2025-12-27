import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import OfflinePage from "@/app/offline/page";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";
import { useRouter } from "next/navigation";
import { electronAPI } from "@/libs/electron-utils";

// Mock hooks and libraries
jest.mock("@/hooks/utils/useNetworkStatus");
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));
jest.mock("@/libs/electron-utils", () => ({
  electronAPI: {
    isElectron: jest.fn(),
    offline: {
      getOfflineSongs: jest.fn(),
    },
  },
}));

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
jest.mock("@/components/Song/SongItem", () => ({ data }: any) => (
  <div data-testid="mock-song-item">{data.title}</div>
));

describe("OfflinePage", () => {
  const mockUseNetworkStatus = useNetworkStatus as jest.Mock;
  const mockRouterPush = jest.fn();
  const mockIsElectron = electronAPI.isElectron as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockRouterPush,
    });
  });

  it("オンラインの場合はホームにリダイレクトする", () => {
    mockUseNetworkStatus.mockReturnValue({ isOnline: true });
    render(<OfflinePage />);
    expect(mockRouterPush).toHaveBeenCalledWith("/");
  });

  it("オフラインの場合はヘッダーとコンテンツを表示する", async () => {
    mockUseNetworkStatus.mockReturnValue({ isOnline: false });
    mockIsElectron.mockReturnValue(true);

    render(<OfflinePage />);

    // Header content check
    expect(screen.getByText("Offline Mode")).toBeInTheDocument();
    expect(
      screen.getByText(
        "You are currently offline. Access your downloaded music here."
      )
    ).toBeInTheDocument();

    // Verify loading state finishes
    await waitFor(() => {
      // Since logic is currently mocked/commented out, it returns empty list
      expect(
        screen.getByText("No downloaded songs found.")
      ).toBeInTheDocument();
    });
  });
});
