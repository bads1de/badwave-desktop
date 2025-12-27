import Header from "@/components/Header/Header";
import SearchInput from "@/components/common/SearchInput";
import SearchContent from "./components/SearchContent";
import HeaderNav from "@/components/Header/HeaderNav";

interface SearchProps {
  searchParams: Promise<{ title: string; tab?: string }>;
}

const Search = async (props: SearchProps) => {
  const searchParams = await props.searchParams;
  const title = searchParams.title || "";

  // SSRでのデータフェッチを廃止し、クライアントサイドで取得
  return (
    <div className="bg-[#0d0d0d] rounded-lg w-full h-full overflow-hidden overflow-y-auto custom-scrollbar">
      <Header className="sticky top-0 z-10">
        <div className="flex flex-col gap-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-white text-2xl font-bold">検索</h1>
          </div>
          <SearchInput />
          <HeaderNav className="mt-2" />
        </div>
      </Header>
      <SearchContent searchTitle={title} />
    </div>
  );
};

export default Search;
