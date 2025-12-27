import React from "react";
import GenreContent from "./components/GenreContent";
import GenreHeader from "./components/GenreHeader";

interface genreProps {
  params: Promise<{
    genre: string;
  }>;
}

const page = async (props: genreProps) => {
  const params = await props.params;
  const { genre } = params;
  const decodedGenre = decodeURIComponent(genre);

  // SSRでのデータフェッチを廃止し、クライアントサイドで取得
  return (
    <div className="bg-[#0d0d0d] rounded-lg w-full h-full overflow-hidden overflow-y-auto custom-scrollbar">
      <GenreHeader genre={decodedGenre} />
      <GenreContent genre={decodedGenre} />
    </div>
  );
};

export default page;
