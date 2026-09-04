"use client";

import { useRouter } from "next/navigation";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import qs from "query-string";
import { MdLibraryMusic } from "react-icons/md";
import { RiPlayListFill } from "react-icons/ri";

interface HeaderNavProps {
  className?: string;
}

const HeaderNav: React.FC<HeaderNavProps> = ({ className = "" }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<string>("songs");

  // 検索クエリがある場合はそれを取得
  const title = searchParams.get("title") || "";

  useEffect(() => {
    // URLからtabパラメータを取得
    const tab = searchParams.get("tab") || "songs";
    setActiveTab(tab);
  }, [searchParams]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);

    // 現在のクエリパラメータを維持しながら、tabパラメータを更新
    const currentQuery: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      currentQuery[key] = value;
    });

    const url = qs.stringifyUrl({
      url: pathname,
      query: {
        ...currentQuery,
        tab: value,
      },
    });

    router.push(url);
  };

  return (
    <div className={`flex items-center gap-x-4 ${className} font-mono`}>
      <button
        onClick={() => handleTabChange("songs")}
        className={`relative flex items-center gap-3 px-6 py-2 rounded-none text-xs font-black transition-all duration-300 group/tab uppercase tracking-widest ${
          activeTab === "songs"
            ? "bg-theme-500/20 text-white border border-theme-500/60 shadow-[0_0_15px_rgba(var(--theme-500),0.3)]"
            : "bg-[#0a0a0f] text-theme-500/40 border border-theme-500/10 hover:border-theme-500/40 hover:text-theme-400"
        }`}
      >
        <MdLibraryMusic
          size={16}
          className={activeTab === "songs" ? "animate-pulse" : ""}
        />
        <span>SONGS_TRACKS</span>
        {/* 装飾用パーツ */}
        <div
          className={`absolute -top-0.5 -left-0.5 w-2 h-2 border-t-2 border-l-2 transition-colors ${
            activeTab === "songs" ? "border-theme-500" : "border-transparent"
          }`}
        />
        <div
          className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 border-b-2 border-r-2 transition-colors ${
            activeTab === "songs" ? "border-theme-500" : "border-transparent"
          }`}
        />
      </button>

      <button
        onClick={() => handleTabChange("playlists")}
        className={`relative flex items-center gap-3 px-6 py-2 rounded-none text-xs font-black transition-all duration-300 group/tab uppercase tracking-widest ${
          activeTab === "playlists"
            ? "bg-theme-500/20 text-white border border-theme-500/60 shadow-[0_0_15px_rgba(var(--theme-500),0.3)]"
            : "bg-[#0a0a0f] text-theme-500/40 border border-theme-500/10 hover:border-theme-500/40 hover:text-theme-400"
        }`}
      >
        <RiPlayListFill
          size={16}
          className={activeTab === "playlists" ? "animate-pulse" : ""}
        />
        <span>PLAYLISTS_DB</span>
        {/* 装飾用パーツ */}
        <div
          className={`absolute -top-0.5 -left-0.5 w-2 h-2 border-t-2 border-l-2 transition-colors ${
            activeTab === "playlists"
              ? "border-theme-500"
              : "border-transparent"
          }`}
        />
        <div
          className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 border-b-2 border-r-2 transition-colors ${
            activeTab === "playlists"
              ? "border-theme-500"
              : "border-transparent"
          }`}
        />
      </button>
    </div>
  );
};

export default HeaderNav;
