"use client";

import React, { use } from "react";
import GenreHeader from "@/components/Genre/GenreHeader";
import GenreContent from "@/components/Genre/GenreContent";

interface genreProps {
  params: Promise<{
    genre: string;
  }>;
}

const GenrePage = (props: genreProps) => {
  const params = use(props.params);
  const { genre } = params;
  const decodedGenre = decodeURIComponent(genre);

  return (
    <div className="bg-[#0d0d0d] rounded-lg w-full h-full overflow-hidden overflow-y-auto custom-scrollbar">
      <GenreHeader genre={decodedGenre} />
      <GenreContent genre={decodedGenre} />
    </div>
  );
};

export default GenrePage;
