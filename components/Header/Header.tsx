"use client";

import { twMerge } from "tailwind-merge";

interface HeaderProps {
  children: React.ReactNode;
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ children, className }) => {
  return (
    <div
      className={twMerge(
        `
        relative
        h-fit
        bg-gradient-to-b
        from-purple-900/10
        via-neutral-900/95
        to-neutral-900/90
        backdrop-blur-xl
        `,
        className
      )}
    >
      <div className="w-full px-6 py-4">
        <div className="flex items-center justify-between w-full mb-4">
          <div className="flex items-center gap-x-2 md:gap-x-4"></div>
          <div className="flex items-center gap-x-2 md:gap-x-4">
            <div className="flex justify-between items-center gap-x-4"></div>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
};

// displayName を設定
Header.displayName = "Header";

export default Header;
