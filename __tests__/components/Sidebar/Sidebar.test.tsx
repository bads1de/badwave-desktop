import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Sidebar from "@/components/Sidebar/Sidebar";
import { usePathname } from "next/navigation";
import usePlayer from "@/hooks/player/usePlayer";
import { useUser } from "@/hooks/auth/useUser";

// モックの設定
jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
  useRouter: jest.fn(),
}));
jest.mock("@/hooks/player/usePlayer");
jest.mock("@/hooks/auth/useUser");
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}));
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

// UIコンポーネントのモック
jest.mock("@/components/ui/popover", () => ({
  Popover: ({ children }: any) => <div>{children}</div>,
  PopoverTrigger: ({ children }: any) => <div>{children}</div>,
  PopoverContent: ({ children }: any) => <div>{children}</div>,
}));

// Studio と UserCard もモック化
jest.mock("@/components/Sidebar/Studio", () => ({
  __esModule: true,
  default: ({ isCollapsed }: { isCollapsed: boolean }) => (
    <div data-testid="studio-mock">{isCollapsed ? "C" : "Expanded Studio"}</div>
  ),
}));
jest.mock("@/components/Sidebar/UserCard", () => ({
  __esModule: true,
  default: ({ userDetails, isCollapsed }: any) => (
    <div data-testid="user-card-mock">
      {isCollapsed ? "UC" : userDetails?.full_name || "Guest"}
    </div>
  ),
}));

describe("Sidebar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (usePathname as jest.Mock).mockReturnValue("/");
    (usePlayer as jest.Mock).mockReturnValue({ activeId: null });
    (useUser as jest.Mock).mockReturnValue({
      user: { id: "user-1" },
      userDetails: { full_name: "Test User" },
    });
  });

  it("正しくレンダリングされ、ナビゲーション項目が表示される", () => {
    render(
      <Sidebar>
        <div data-testid="content">Page Content</div>
      </Sidebar>
    );

    expect(screen.getByText("ホーム")).toBeInTheDocument();
    expect(screen.getByText("検索")).toBeInTheDocument();
    expect(screen.getByText("ローカル")).toBeInTheDocument();
    expect(screen.getByText("Pulse")).toBeInTheDocument();
    expect(screen.getByText("BadWave")).toBeInTheDocument();
    expect(screen.getByTestId("content")).toBeInTheDocument();
  });

  it("サイドバーの折りたたみが動作する", () => {
    render(
      <Sidebar>
        <div>Content</div>
      </Sidebar>
    );

    // 最初は展開されている（BadWaveのテキストが存在）
    expect(screen.getByText("BadWave")).toBeInTheDocument();

    // 折りたたみボタンをクリック (GoSidebarCollapse を含むボタン)
    // GoSidebarCollapse の代わりに aria-label などがないため、role で探す
    const collapseButton = screen.getAllByRole("button")[0];
    fireEvent.click(collapseButton);

    // 折りたたまれると BadWave のテキストが表示されない (isCollapsed = true)
    expect(screen.queryByText("BadWave")).not.toBeInTheDocument();

    // Studio と UserCard が折りたたみ状態を反映していることを確認
    expect(screen.getByTestId("studio-mock")).toHaveTextContent("C");
    expect(screen.getByTestId("user-card-mock")).toHaveTextContent("UC");
  });

  it("ログインしている場合はライブラリボタンが表示される", () => {
    render(
      <Sidebar>
        <div>Content</div>
      </Sidebar>
    );

    expect(screen.getByText("ライブラリ")).toBeInTheDocument();
  });

  it("ログインしていない場合はライブラリボタンが表示されない", () => {
    (useUser as jest.Mock).mockReturnValue({
      user: null,
      userDetails: null,
    });

    render(
      <Sidebar>
        <div>Content</div>
      </Sidebar>
    );

    expect(screen.queryByText("ライブラリ")).not.toBeInTheDocument();
  });
});
