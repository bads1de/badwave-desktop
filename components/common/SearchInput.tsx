"use client";

import qs from "query-string";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useDebounce from "@/hooks/utils/useDebounce";
import { BiSearch } from "react-icons/bi";
import { IoMdClose } from "react-icons/io";

interface SearchInputProps {
  placeholder?: string;
}

interface QueryParams {
  [key: string]: string | undefined;
}

const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = "曲やプレイリストを検索",
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState<string>("");
  const debouncedValue = useDebounce<string>(value, 500);

  // 初期値をURLから取得
  useEffect(() => {
    const title = searchParams.get("title");

    if (title) {
      setValue(title);
    }
  }, [searchParams]);

  useEffect(() => {
    // 現在のクエリパラメータを維持
    const currentQuery: QueryParams = {};
    searchParams.forEach((value, key) => {
      currentQuery[key] = value;
    });

    const query: QueryParams = {
      ...currentQuery,
      title: debouncedValue || undefined,
    };

    // 空の検索の場合はtitleパラメータを削除
    if (!debouncedValue) {
      query.title = undefined;
    }

    const url = qs.stringifyUrl({
      url: "/search",
      query,
    });

    router.push(url);
  }, [debouncedValue, router, searchParams]);

  return (
    <div className="relative w-full group">
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-900/20 opacity-0 group-focus-within:opacity-100 transition-all duration-300 -z-10" />
      <div className="relative flex items-center gap-2 w-full rounded-xl bg-neutral-800/80 backdrop-blur-sm border border-white/[0.05] group-hover:border-purple-500/30 group-focus-within:border-purple-500/50 transition-all duration-300 px-4 py-3">
        <BiSearch
          className="text-neutral-400 group-hover:text-neutral-300 group-focus-within:text-purple-400 transition-colors"
          size={22}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-neutral-200 placeholder:text-neutral-400 focus:outline-none text-base"
        />
        {value && (
          <button
            onClick={() => setValue("")}
            className="p-1.5 rounded-lg hover:bg-neutral-700/80 transition-colors"
            aria-label="検索をクリア"
          >
            <IoMdClose
              className="text-neutral-400 hover:text-white transition-colors"
              size={18}
            />
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchInput;
