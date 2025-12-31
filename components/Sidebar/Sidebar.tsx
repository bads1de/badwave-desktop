"use client";

import { twMerge } from "tailwind-merge";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { HiHome, HiFolder } from "react-icons/hi";
import { BiSearch, BiLibrary } from "react-icons/bi";
import Box from "../common/Box";
import SidebarItem from "./SidebarItem";
import Studio from "./Studio";
import usePlayer from "@/hooks/player/usePlayer";
import { RiPlayListFill, RiPulseLine } from "react-icons/ri";
import { FaHeart } from "react-icons/fa6";
import { useUser } from "@/hooks/auth/useUser";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import Link from "next/link";
import Hover from "../common/Hover";
import Image from "next/image";
import { GoSidebarCollapse } from "react-icons/go";
import UserCard from "./UserCard";

interface SidebarProps {
  children: React.ReactNode;
}

const Sidebar: React.FC<SidebarProps> = ({ children }) => {
  const pathname = usePathname();
  const player = usePlayer();
  const { user, userDetails } = useUser();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const routes = useMemo(
    () => [
      {
        icon: HiHome,
        label: "ホーム",
        active: pathname === "/",
        href: "/",
      },
      {
        icon: BiSearch,
        label: "検索",
        active: pathname === "/search",
        href: "/search",
      },
      {
        icon: HiFolder,
        label: "ローカル",
        active: pathname === "/local",
        href: "/local",
      },
      {
        icon: RiPulseLine,
        label: "Pulse",
        active: pathname === "/pulse",
        href: "/pulse",
      },
    ],
    [pathname]
  );

  const isLibraryActive = useMemo(() => {
    return pathname === "/playlists" || pathname === "/liked";
  }, [pathname]);

  const isPulsePage = pathname === "/pulse";

  return (
    <div
      className={twMerge(
        `flex h-full`,
        // Pulse ページでは Player が非表示のため、高さ調整をスキップ
        player.activeId && !isPulsePage && "h-[calc(100%-80px)]"
      )}
    >
      <div
        className={twMerge(
          "flex flex-col gap-y-2.5 bg-gradient-to-br from-black/95 via-neutral-900/90 to-neutral-900/85 h-full p-2.5 transition-all duration-500 backdrop-blur-2xl border-r border-white/[0.02] shadow-xl shadow-black/10",
          isCollapsed ? "w-20" : "w-72"
        )}
      >
        <div className="flex items-center justify-between px-2.5 py-2">
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-theme-500/20 to-theme-900/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
              <Image
                src="/logo.svg"
                alt="Logo"
                width={isCollapsed ? 160 : 48}
                height={isCollapsed ? 160 : 48}
                className="relative cursor-pointer transition-all duration-300 hover:scale-105 z-10"
                onClick={() => isCollapsed && setIsCollapsed(!isCollapsed)}
              />
            </div>
            {!isCollapsed && (
              <h1 className="ml-2 font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-neutral-400">
                BadWave
              </h1>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-neutral-400 hover:text-white hover:bg-white/5 transition-all duration-300"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? "" : <GoSidebarCollapse size={20} />}
          </Button>
        </div>

        <Box className="bg-neutral-900/40 backdrop-blur-xl border border-white/[0.02] shadow-inner">
          <div className="flex flex-col gap-y-3 px-4 py-3">
            {routes.map((item) => (
              <SidebarItem
                key={item.label}
                {...item}
                isCollapsed={isCollapsed}
              />
            ))}
            {user && (
              <Popover>
                <PopoverTrigger asChild>
                  <div
                    className={twMerge(
                      "cursor-pointer transition",
                      isCollapsed
                        ? "w-full flex items-center justify-center border-b border-transparent"
                        : "flex h-auto w-full items-center gap-x-4 py-3.5 px-4 rounded-xl",
                      isLibraryActive
                        ? isCollapsed
                          ? "border-theme-500/30"
                          : "bg-theme-500/20 text-white border border-theme-500/30"
                        : `border-transparent ${
                            isCollapsed
                              ? "border-white/5"
                              : "text-neutral-400 hover:text-white"
                          }`
                    )}
                  >
                    {isCollapsed ? (
                      <Hover
                        description="ライブラリ"
                        contentSize="w-auto px-3 py-2"
                        side="right"
                      >
                        <div className="p-3 rounded-xl">
                          <BiLibrary
                            size={20}
                            className={twMerge(
                              isLibraryActive
                                ? "text-theme-400"
                                : "text-neutral-400"
                            )}
                          />
                        </div>
                      </Hover>
                    ) : (
                      <>
                        <BiLibrary size={24} />
                        <p className="truncate text-sm font-medium">
                          ライブラリ
                        </p>
                      </>
                    )}
                  </div>
                </PopoverTrigger>
                <PopoverContent
                  side="right"
                  align="start"
                  className="w-52 p-2 bg-neutral-900/95 backdrop-blur-xl border border-white/10 shadow-xl"
                >
                  <div className="flex flex-col gap-y-1">
                    <Link
                      href="/playlists"
                      className={twMerge(
                        "flex items-center gap-x-3 px-3 py-2.5 rounded-lg transition-all duration-300",
                        pathname === "/playlists"
                          ? "bg-theme-500/20 text-white"
                          : "text-neutral-400 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <RiPlayListFill size={20} />
                      <p className="text-sm font-medium">プレイリスト</p>
                    </Link>
                    <Link
                      href="/liked"
                      className={twMerge(
                        "flex items-center gap-x-3 px-3 py-2.5 rounded-lg transition-all duration-300",
                        pathname === "/liked"
                          ? "bg-theme-500/20 text-white"
                          : "text-neutral-400 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <FaHeart size={20} />
                      <p className="text-sm font-medium">お気に入り</p>
                    </Link>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </Box>

        <Box className="overflow-y-auto flex-1 custom-scrollbar bg-neutral-900/40 backdrop-blur-xl border border-white/[0.02] shadow-inner">
          <Studio isCollapsed={isCollapsed} />
        </Box>

        <div className=" mb-6">
          <UserCard userDetails={userDetails} isCollapsed={isCollapsed} />
        </div>
      </div>
      <main className="h-full flex-1 overflow-y-auto  bg-gradient-to-b from-neutral-900 to-black">
        {children}
      </main>
    </div>
  );
};

export default Sidebar;
