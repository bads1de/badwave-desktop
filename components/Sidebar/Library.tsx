"use client";

import { TbPlaylist } from "react-icons/tb";
import { AiOutlinePlus } from "react-icons/ai";

interface LibraryProps {
  isCollapsed?: boolean;
}

const Library: React.FC<LibraryProps> = ({ isCollapsed = false }) => {
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-4 pt-4">
        <div className="inline-flex items-center gap-x-2">
          <TbPlaylist className="text-neutral-400" size={26} />
          {!isCollapsed && (
            <p className="text-neutral-400 font-medium text-md">
              ライブラリ
            </p>
          )}
        </div>
        {!isCollapsed && (
          <AiOutlinePlus
            onClick={() => {}}
            size={20}
            className="
              text-neutral-400 
              cursor-pointer 
              hover:text-white 
              transition
            "
          />
        )}
      </div>
      <div className="flex flex-col gap-y-2 mt-4 px-3">
        {!isCollapsed ? (
          <div className="text-neutral-400 text-sm">
            プレイリストがありません
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Library;
