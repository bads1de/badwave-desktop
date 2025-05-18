import React from "react";
import getSongsByGenre from "@/actions/getSongsByGenre";
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
  const songs = await getSongsByGenre(decodedGenre);

  return (
    <div className="bg-[#0d0d0d] rounded-lg w-full h-full overflow-hidden overflow-y-auto custom-scrollbar">
      <GenreHeader genre={decodedGenre} />
      <GenreContent songs={songs} />
    </div>
  );
};

export default page;
