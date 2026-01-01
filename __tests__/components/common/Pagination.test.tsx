import { render, screen, fireEvent } from "@testing-library/react";
import Pagination from "@/components/common/Pagination";

describe("Pagination", () => {
  const mockOnPageChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("totalPages が 1 以下の場合は何も表示しない", () => {
    const { container } = render(
      <Pagination
        currentPage={0}
        totalPages={1}
        onPageChange={mockOnPageChange}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it("ページ番号ボタンを表示する", () => {
    render(
      <Pagination
        currentPage={0}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />
    );

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("現在のページがハイライトされる", () => {
    render(
      <Pagination
        currentPage={0}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />
    );

    const currentPageButton = screen.getByText("1");
    expect(currentPageButton).toHaveClass("bg-green-500");
  });

  it("ページ番号をクリックすると onPageChange が呼ばれる", () => {
    render(
      <Pagination
        currentPage={0}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />
    );

    fireEvent.click(screen.getByText("3"));
    expect(mockOnPageChange).toHaveBeenCalledWith(2); // 0-indexed
  });

  it("最初のページで「前へ」ボタンが無効", () => {
    render(
      <Pagination
        currentPage={0}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />
    );

    const prevButton = screen.getByLabelText("Previous page");
    expect(prevButton).toBeDisabled();
  });

  it("最後のページで「次へ」ボタンが無効", () => {
    render(
      <Pagination
        currentPage={4}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />
    );

    const nextButton = screen.getByLabelText("Next page");
    expect(nextButton).toBeDisabled();
  });

  it("「次へ」ボタンをクリックすると次のページに移動", () => {
    render(
      <Pagination
        currentPage={2}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />
    );

    const nextButton = screen.getByLabelText("Next page");
    fireEvent.click(nextButton);
    expect(mockOnPageChange).toHaveBeenCalledWith(3);
  });

  it("「前へ」ボタンをクリックすると前のページに移動", () => {
    render(
      <Pagination
        currentPage={2}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />
    );

    const prevButton = screen.getByLabelText("Previous page");
    fireEvent.click(prevButton);
    expect(mockOnPageChange).toHaveBeenCalledWith(1);
  });

  it("ページ数が多い場合に省略記号が表示される", () => {
    render(
      <Pagination
        currentPage={5}
        totalPages={10}
        onPageChange={mockOnPageChange}
      />
    );

    // 省略記号が表示されることを確認
    const dots = screen.getAllByText("...");
    expect(dots.length).toBeGreaterThan(0);
  });
});
