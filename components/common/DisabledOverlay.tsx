"use client";

import React from "react";

interface DisabledOverlayProps {
  children: React.ReactNode;
  disabled?: boolean;
  size?: number;
  className?: string;
}

/**
 * 子要素に斜めのスラッシュを重ねて「使用不可」を表現するコンポーネント
 */
const DisabledOverlay: React.FC<DisabledOverlayProps> = ({
  children,
  disabled = false,
  size = 24,
  className = "",
}) => {
  if (!disabled) {
    return <>{children}</>;
  }

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
    >
      <div className="opacity-40 grayscale pointer-events-none">{children}</div>
      <svg
        className="absolute inset-0 pointer-events-none"
        width="100%"
        height="100%"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <line
          x1="20"
          y1="4"
          x2="4"
          y2="20"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-neutral-500"
        />
      </svg>
    </div>
  );
};

export default DisabledOverlay;
