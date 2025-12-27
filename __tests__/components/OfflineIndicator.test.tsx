import React from "react";
import { render, screen } from "@testing-library/react";
import OfflineIndicator from "@/components/common/OfflineIndicator";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";

// hooks のモック
jest.mock("@/hooks/utils/useNetworkStatus");

describe("OfflineIndicator", () => {
  const mockUseNetworkStatus = useNetworkStatus as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("オンライン時は何も表示しない", () => {
    mockUseNetworkStatus.mockReturnValue({
      isOnline: true,
      wasOffline: false,
    });

    const { container } = render(<OfflineIndicator />);

    expect(container.firstChild).toBeNull();
  });

  it("オフライン時は 'オフラインモード' というメッセージを表示する", () => {
    mockUseNetworkStatus.mockReturnValue({
      isOnline: false,
      wasOffline: true,
    });

    render(<OfflineIndicator />);

    expect(screen.getByText(/オフラインモード/i)).toBeInTheDocument();
  });

  it("特定のスタイルが適用されているか確認（バナー形式など）", () => {
    mockUseNetworkStatus.mockReturnValue({
      isOnline: false,
      wasOffline: true,
    });

    render(<OfflineIndicator />);

    const indicator = screen.getByText(/オフラインモード/i).parentElement;
    expect(indicator).toHaveClass("bg-yellow-500/10"); // 例として
  });
});
