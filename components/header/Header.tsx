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
        z-40
        h-fit
        bg-[#0a0a0f]/80
        backdrop-blur-md
        border-b-2
        border-theme-500/40
        shadow-[0_4px_30px_rgba(0,0,0,0.8),0_2px_10px_rgba(var(--theme-500),0.1)]
        font-mono
        `,
        className,
      )}
    >
      {/* 背景装飾 */}
      <div className="absolute inset-0 opacity-5 pointer-events-none bg-[length:100%_4px] bg-[linear-gradient(rgba(255,255,255,0)_50%,rgba(0,0,0,0.5)_50%)]" />

      <div className="w-full px-8 py-6 relative overflow-hidden z-10">
        {/* 装飾的なHUDパーツ */}
        <div className="absolute top-0 right-0 w-24 h-24 border-t border-r border-theme-500/20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-24 h-24 border-b border-l border-theme-500/20 pointer-events-none" />

        {/* メタデータライン */}
        <div className="flex justify-between items-center mb-6 text-[8px] text-theme-500/30 uppercase tracking-[0.4em] font-black">
          <span>// SECTOR_ACCESS: AUTHORIZED</span>
          <div className="flex gap-4">
            <span>SCAN_NODE: 0x7F</span>
            <span className="animate-pulse">SIGNAL: OPTIMAL</span>
          </div>
        </div>

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
