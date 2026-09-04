"use client";

import React from "react";
import { PictureInPicture2 } from "lucide-react";
import { miniPlayer, isElectron } from "@/libs/electron";

interface MiniPlayerButtonProps {
  disabled?: boolean;
}

const MiniPlayerButton: React.FC<MiniPlayerButtonProps> = ({ disabled }) => {
  const handleOpenMiniPlayer = async () => {
    if (!isElectron() || disabled) return;
    await miniPlayer.open();
  };

  // Electron環境でない場合は表示しない
  if (!isElectron()) {
    return null;
  }

  return (
    <button
      onClick={handleOpenMiniPlayer}
      disabled={disabled}
      title="ミニプレイヤーを開く"
      className={`transition-all duration-300 ${
        disabled
          ? "text-neutral-600 cursor-not-allowed"
          : "cursor-pointer text-neutral-400 hover:text-white hover:filter hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]"
      }`}
    >
      <PictureInPicture2 size={20} />
    </button>
  );
};

export default MiniPlayerButton;
