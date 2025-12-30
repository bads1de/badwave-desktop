"use client";

import Header from "@/components/Header/Header";
import SongListContent from "@/components/Song/SongListContent";

const Liked = () => {
  return (
    <div className="bg-neutral-950 rounded-lg h-full w-full overflow-hidden overflow-y-auto custom-scrollbar">
      <Header>
        <div className="mt-24 mb-8">
          <div className="flex flex-col md:flex-row items-end gap-x-6">
            <div className="flex flex-col gap-y-3">
              <h1 className="text-white text-5xl sm:text-6xl lg:text-8xl font-black tracking-tighter drop-shadow-2xl">
                <span className="bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/40">
                  お気に入り
                </span>
              </h1>
              <div className="flex items-center gap-x-2 text-neutral-400 font-medium ml-1">
                <span className="w-8 h-[2px] bg-theme-500 rounded-full"></span>
                <span className="text-sm tracking-widest uppercase opacity-70">
                  Your Collection
                </span>
              </div>
            </div>
          </div>
        </div>
      </Header>
      <div className="px-2 sm:px-4">
        <SongListContent />
      </div>
    </div>
  );
};

export default Liked;
