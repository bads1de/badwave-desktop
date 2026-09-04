"use client";

import { IconType } from "react-icons";
import Link from "next/link";
import { twMerge } from "tailwind-merge";
import Hover from "../common/Hover";
import { memo } from "react";

interface SidebarItemProps {
  icon: IconType;
  label: string;
  active?: boolean;
  href: string;
  isCollapsed?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = memo(
  ({ icon: Icon, label, active, href, isCollapsed }) => {
    if (isCollapsed) {
      return (
        <Link
          href={href}
          className={twMerge(
            `w-full flex items-center justify-center border-b border-transparent py-1`,
            active ? "border-theme-500/30" : "border-white/5"
          )}
        >
          <Hover
            description={`[ ${label.toUpperCase()} ]`}
            contentSize="w-auto px-3 py-2"
            side="right"
          >
            <div className="p-3 rounded-none relative group/collapsed">
              <Icon
                size={20}
                className={twMerge(
                  "transition-all duration-300",
                  active
                    ? "text-theme-400 drop-shadow-[0_0_8px_rgba(var(--theme-500),0.8)]"
                    : "text-theme-500/60 group-hover/collapsed:text-white"
                )}
              />
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-theme-500 shadow-[0_0_10px_rgba(var(--theme-500),0.8)]" />
              )}
            </div>
          </Hover>
        </Link>
      );
    }

    return (
      <Link
        href={href}
        className={twMerge(
          `relative flex h-auto w-full items-center gap-x-3 py-3 px-3 rounded-xl transition-all duration-500 cyber-glitch group/item font-mono uppercase tracking-[0.2em]`,
          active
            ? "bg-[#0a0a0f] text-white border border-theme-500/50 shadow-[inset_0_0_15px_rgba(var(--theme-500),0.15)]"
            : "text-theme-500/60 border border-transparent hover:text-white hover:border-theme-500/30 hover:bg-theme-500/5"
        )}
      >
        {/* HUD装飾コーナー */}
        <div
          className={twMerge(
            "absolute top-0 right-0 w-2 h-2 border-t border-r transition-colors z-10 rounded-tr-xl",
            active
              ? "border-theme-500"
              : "border-theme-500/0 group-hover/item:border-theme-500/40"
          )}
        />
        <div
          className={twMerge(
            "absolute bottom-0 left-0 w-2 h-2 border-b border-l transition-colors z-10 rounded-bl-xl",
            active
              ? "border-theme-500"
              : "border-theme-500/0 group-hover/item:border-theme-500/40"
          )}
        />

        <Icon
          size={24}
          className={twMerge(
            "transition-all duration-300",
            active
              ? "text-theme-400 drop-shadow-[0_0_10px_rgba(var(--theme-500),0.8)]"
              : "group-hover/item:text-theme-300"
          )}
        />
        <p className="truncate text-xs font-bold">{label}</p>
      </Link>
    );
  }
);

// displayName を設定
SidebarItem.displayName = "SidebarItem";

export default SidebarItem;
