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
    <div className={`flex items-center space-x-2 ${className}`}>
      <button
        onClick={() => handleTabChange("songs")}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
          activeTab === "songs"
            ? "bg-theme-600/90 text-white shadow-md shadow-theme-900/20"
            : "bg-neutral-800/80 text-neutral-300 hover:bg-neutral-700/80 hover:text-white"
        }`}
      >
        <MdLibraryMusic size={18} />
        <span>曲</span>
      </button>
      <button
        onClick={() => handleTabChange("playlists")}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
          activeTab === "playlists"
            ? "bg-theme-600/90 text-white shadow-md shadow-theme-900/20"
            : "bg-neutral-800/80 text-neutral-300 hover:bg-neutral-700/80 hover:text-white"
        }`}
      >
        <RiPlayListFill size={18} />
        <span>プレイリスト</span>
      </button>
    </div>
  );
};

export default HeaderNav;
