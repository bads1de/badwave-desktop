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
import { ROUTES } from "@/constants";
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
    return pathname === ROUTES.PLAYLISTS || pathname === ROUTES.LIKED;
  }, [pathname]);

  const isPulsePage = pathname === "/pulse";

  return (
    <div
      className={twMerge(
        `flex h-full`,
        // Pulse ページでは Player が非表示のため、高さ調整をスキップ
        player.activeId && !isPulsePage && "h-[calc(100%-80px)]",
      )}
    >
      <div
        className={twMerge(
          "flex flex-col gap-y-3 bg-[#0a0a0f]/95 h-full p-3 transition-all duration-500 ease-[cubic_bezier(0.4,0,0.2,1)] backdrop-blur-3xl border-r border-theme-500/20 shadow-[0_0_30px_rgba(0,0,0,0.8)] relative z-50",
          isCollapsed ? "w-[100px]" : "w-[260px]",
          "hidden md:flex font-mono shrink-0"
        )}
      >
        {/* スキャンライン / グリッド装飾 */}
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />

        <div className="flex items-center justify-between px-2 py-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className="relative group cyber-glitch">
              <div className="absolute -inset-2 bg-theme-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
              <div className="relative w-10 h-10 border border-theme-500/40 p-1 flex items-center justify-center bg-black transition-all duration-500 group-hover:border-theme-500">
                <Image
                  src="/logo.svg"
                  alt="Logo"
                  width={32}
                  height={32}
                  className="relative cursor-pointer transition-all duration-500 group-hover:scale-110 z-10 drop-shadow-[0_0_8px_rgba(var(--theme-500),0.6)]"
                  onClick={() => isCollapsed && setIsCollapsed(!isCollapsed)}
                />
                {/* ロゴ周りのコーナー */}
                <div className="absolute -top-1 -left-1 w-2 h-2 border-t border-l border-theme-500" />
                <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b border-r border-theme-500" />
              </div>
            </div>
            {!isCollapsed && (
              <h1 className="font-black text-2xl tracking-[0.25em] text-white uppercase drop-shadow-[0_0_15px_rgba(var(--theme-500),0.7)] group-hover:text-theme-300 transition-all duration-500">
                BADWAVE
              </h1>
            )}
          </div>
          {!isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="text-theme-500 hover:text-white hover:bg-theme-500/20 transition-all duration-300 border border-transparent hover:border-theme-500/30"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              <GoSidebarCollapse size={24} />
            </Button>
          )}
        </div>

        <Box className="flex-1 bg-transparent border-none shadow-none overflow-y-auto custom-scrollbar">
          <div className="flex flex-col gap-y-4 px-1 py-2">
            {routes.map((item) => (
              <SidebarItem
                key={item.label}
                {...item}
                isCollapsed={isCollapsed}
              />
            ))}
            {user && (
              <>
                <Popover>
                  <PopoverTrigger asChild>
                    <div
                      className={twMerge(
                        "cursor-pointer transition-all duration-500 cyber-glitch relative group/item",
                        isCollapsed
                          ? "w-full flex items-center justify-center border-b border-transparent"
                          : "flex h-auto w-full items-center gap-x-3 py-3 px-3 rounded-none",
                        isLibraryActive
                          ? isCollapsed
                            ? "border-theme-500/30 text-theme-300"
                            : "bg-[#0a0a0f] text-white border border-theme-500/50 shadow-[inset_0_0_15px_rgba(var(--theme-500),0.15)]"
                          : `border border-transparent ${
                              isCollapsed
                                ? "border-white/5"
                                : "text-theme-500/60 hover:text-white hover:bg-theme-500/5 hover:border-theme-500/30"
                            }`,
                      )}
                    >
                      {/* HUD装飾コーナー */}
                      <div
                        className={twMerge(
                          "absolute top-0 right-0 w-2 h-2 border-t border-r transition-colors z-10",
                          isLibraryActive
                            ? "border-theme-500"
                            : "border-theme-500/0 group-hover/item:border-theme-500/40",
                        )}
                      />
                      <div
                        className={twMerge(
                          "absolute bottom-0 left-0 w-2 h-2 border-b border-l transition-colors z-10",
                          isLibraryActive
                            ? "border-theme-500"
                            : "border-theme-500/0 group-hover/item:border-theme-500/40",
                        )}
                      />
                      {isCollapsed ? (
                        <Hover
                          description="[ LIBRARY ]"
                          contentSize="w-auto px-3 py-2"
                          side="right"
                        >
                          <div className="p-3 rounded-xl">
                            <BiLibrary
                              size={24}
                              className={twMerge(
                                "transition-all duration-300",
                                isLibraryActive
                                  ? "text-theme-400 drop-shadow-[0_0_8px_rgba(var(--theme-500),0.8)]"
                                  : "text-theme-500/60 group-hover:text-theme-300",
                              )}
                            />
                          </div>
                        </Hover>
                      ) : (
                        <>
                          <BiLibrary
                            size={24}
                            className={twMerge(
                              isLibraryActive &&
                                "drop-shadow-[0_0_8px_rgba(var(--theme-500),0.8)]",
                            )}
                          />
                          <p className="truncate text-sm font-bold tracking-[0.2em] font-mono">
                            [ LIBRARY ]
                          </p>
                        </>
                      )}
                    </div>
                  </PopoverTrigger>
                  <PopoverContent
                    side="right"
                    align="start"
                    className="w-56 p-2 bg-[#0a0a0f]/95 backdrop-blur-2xl border border-theme-500/40 shadow-[0_0_30px_rgba(0,0,0,0.8)] rounded-none"
                  >
                    <div className="flex flex-col gap-y-2 font-mono uppercase tracking-widest text-[10px]">
                      <Link
                        href={ROUTES.PLAYLISTS}
                        className={twMerge(
                          "flex items-center gap-x-3 px-3 py-3 rounded-none transition-all duration-300 border border-transparent hover:border-theme-500/30",
                          pathname === ROUTES.PLAYLISTS
                            ? "bg-theme-500/20 text-white border-theme-500/60 shadow-[0_0_10px_rgba(var(--theme-500),0.3)]"
                            : "text-theme-500/60 hover:text-white hover:bg-theme-500/10",
                        )}
                      >
                        <RiPlayListFill size={20} />
                        <p className="font-bold">// PLAYLISTS</p>
                      </Link>
                      <Link
                        href={ROUTES.LIKED}
                        className={twMerge(
                          "flex items-center gap-x-3 px-3 py-3 rounded-none transition-all duration-300 border border-transparent hover:border-theme-500/30",
                          pathname === ROUTES.LIKED
                            ? "bg-theme-500/20 text-white border-theme-500/60 shadow-[0_0_10px_rgba(var(--theme-500),0.3)]"
                            : "text-theme-500/60 hover:text-white hover:bg-theme-500/10",
                        )}
                      >
                        <FaHeart size={20} />
                        <p className="font-bold">// LIKED_LOG</p>
                      </Link>
                    </div>
                  </PopoverContent>
                </Popover>
                <Studio isCollapsed={isCollapsed} />
              </>
            )}
          </div>
        </Box>

        <div className="mt-auto pt-4 mb-6 relative z-10">
          <UserCard userDetails={userDetails} isCollapsed={isCollapsed} />
        </div>
      </div>
      <main className="h-full flex-1 overflow-y-auto bg-[#0a0a0f]">
        {children}
      </main>
    </div>
  );
};

export default Sidebar;
