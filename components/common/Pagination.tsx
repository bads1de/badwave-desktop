"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/libs/utils";
import useColorSchemeStore from "@/hooks/stores/useColorSchemeStore";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** 現在ページの前後に表示するページ数 */
  siblingCount?: number;
  className?: string;
}

/**
 * ページネーションコンポーネント
 *
 * ページ番号ボタン、前へ/次へボタンを表示
 * 多すぎるページは省略記号（...）でまとめる
 */
const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  className,
}) => {
  const { getColorScheme } = useColorSchemeStore();
  const theme = getColorScheme();

  // ページがない場合は表示しない
  if (totalPages <= 1) return null;

  // 表示するページ番号を計算
  const getPageNumbers = (): (number | "...")[] => {
    const pages: (number | "...")[] = [];

    // 常に最初のページを表示
    pages.push(0);

    // 計算用の範囲
    const leftSibling = Math.max(1, currentPage - siblingCount);
    const rightSibling = Math.min(totalPages - 2, currentPage + siblingCount);

    // 左側の省略記号が必要か
    const showLeftDots = leftSibling > 1;
    // 右側の省略記号が必要か
    const showRightDots = rightSibling < totalPages - 2;

    if (showLeftDots) {
      pages.push("...");
    }

    // 中間のページ
    for (let i = leftSibling; i <= rightSibling; i++) {
      if (i > 0 && i < totalPages - 1) {
        pages.push(i);
      }
    }

    if (showRightDots) {
      pages.push("...");
    }

    // 常に最後のページを表示（ページが複数ある場合）
    if (totalPages > 1) {
      pages.push(totalPages - 1);
    }

    // 重複を削除
    return Array.from(new Set(pages));
  };

  const pageNumbers = getPageNumbers();

  return (
    <nav
      className={cn("flex items-center justify-center gap-1", className)}
      aria-label="Pagination"
    >
      {/* 前へボタン */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 0}
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-lg transition-colors",
          currentPage === 0
            ? "text-neutral-600 cursor-not-allowed"
            : "text-neutral-400 hover:text-white hover:bg-neutral-800"
        )}
        aria-label="Previous page"
      >
        <ChevronLeft size={20} />
      </button>

      {/* ページ番号 */}
      {pageNumbers.map((pageNum, index) =>
        pageNum === "..." ? (
          <span
            key={`dots-${index}`}
            className="flex items-center justify-center w-10 h-10 text-neutral-500"
          >
            ...
          </span>
        ) : (
          <button
            key={pageNum}
            onClick={() => onPageChange(pageNum)}
            className={cn(
              "flex items-center justify-center min-w-10 h-10 px-3 rounded-lg font-medium transition-colors",
              pageNum === currentPage
                ? "text-white shadow-md shadow-black/20"
                : "text-neutral-400 hover:text-white hover:bg-neutral-800"
            )}
            style={
              pageNum === currentPage
                ? { backgroundColor: theme.colors.accentFrom }
                : undefined
            }
            aria-current={pageNum === currentPage ? "page" : undefined}
          >
            {pageNum + 1}
          </button>
        )
      )}

      {/* 次へボタン */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages - 1}
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-lg transition-colors",
          currentPage >= totalPages - 1
            ? "text-neutral-600 cursor-not-allowed"
            : "text-neutral-400 hover:text-white hover:bg-neutral-800"
        )}
        aria-label="Next page"
      >
        <ChevronRight size={20} />
      </button>
    </nav>
  );
};

export default React.memo(Pagination);
