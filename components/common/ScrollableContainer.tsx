"use client";

import React, { useRef, memo, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ScrollableContainerProps {
  children: React.ReactNode;
  showArrows?: boolean;
  className?: string;
}

const ScrollableContainer: React.FC<ScrollableContainerProps> = memo(
  ({ children, showArrows = false, className = "" }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    // スクロール関数をメモ化
    const scroll = useCallback((direction: "left" | "right") => {
      if (scrollRef.current) {
        const containerWidth = scrollRef.current.clientWidth;
        const scrollAmount =
          direction === "left" ? -containerWidth * 0.8 : containerWidth * 0.8;

        scrollRef.current.scrollBy({
          left: scrollAmount,
          behavior: "smooth",
        });
      }
    }, []);

    return (
      <div className="relative">
        {showArrows && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full z-10 hover:bg-opacity-75 transition-all hidden md:block"
          >
            <ChevronLeft size={24} />
          </button>
        )}
        <div
          ref={scrollRef}
          className={`flex overflow-x-auto space-x-4 pb-4 scrollbar-hide smooth-scroll ${className}`}
        >
          {children}
        </div>
        {showArrows && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full z-10 hover:bg-opacity-75 transition-all hidden md:block"
          >
            <ChevronRight size={24} />
          </button>
        )}
      </div>
    );
  }
);

// 表示名を設定
ScrollableContainer.displayName = "ScrollableContainer";

export default ScrollableContainer;
