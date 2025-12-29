import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import HomeHeader from "@/components/Header/HomeHeader";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/auth/useUser";
import useAuthModal from "@/hooks/auth/useAuthModal";

// モックの設定
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));
jest.mock("@/hooks/auth/useUser");
jest.mock("@/hooks/auth/useAuthModal");
jest.mock("@/libs/supabase/client", () => ({
  createClient: jest.fn(() => ({
    auth: {
      signOut: jest.fn().mockResolvedValue({ error: null }),
    },
  })),
}));
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}));
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

describe("HomeHeader", () => {
  const mockRouter = {
    push: jest.fn(),
    refresh: jest.fn(),
  };
  const mockAuthModal = {
    onOpen: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useAuthModal as jest.Mock).mockReturnValue(mockAuthModal);
    (useUser as jest.Mock).mockReturnValue({
      user: null,
      userDetails: null,
    });
  });

  it("ロゴとアプリ名が表示される", () => {
    render(<HomeHeader />);
    expect(screen.getByText("BadWave")).toBeInTheDocument();
    expect(screen.getByAltText("Logo")).toBeInTheDocument();
  });

  it("未ログイン時はログインと新規登録ボタンが表示される", () => {
    render(<HomeHeader />);
    expect(screen.getByText("ログイン")).toBeInTheDocument();
    expect(screen.getByText("新規登録")).toBeInTheDocument();
  });

  it("ログインボタンをクリックするとログインモーダルが開く", () => {
    render(<HomeHeader />);
    fireEvent.click(screen.getByText("ログイン"));
    expect(mockAuthModal.onOpen).toHaveBeenCalled();
  });

  it("ログイン時はユーザーアバターが表示される", () => {
    (useUser as jest.Mock).mockReturnValue({
      user: { id: "user-1" },
      userDetails: { avatar_url: "/avatar.jpg" },
    });

    render(<HomeHeader />);
    expect(screen.getByAltText("ユーザーアバター")).toBeInTheDocument();
    expect(screen.queryByText("ログイン")).not.toBeInTheDocument();
  });

  it("スクロールするとスタイルが変化する", () => {
    render(<HomeHeader />);

    // スクロール前はシャドウがないはず（クラス名に含まれない）
    const header = screen.getByText("BadWave").closest("div.fixed");
    expect(header?.className).not.toContain("shadow-lg");

    // スクロールをシミュレート
    act(() => {
      // @ts-ignore
      window.scrollY = 20;
      window.dispatchEvent(new Event("scroll"));
    });

    // スクロール後はシャドウがつく
    expect(header?.className).toContain("shadow-lg");
  });
});
