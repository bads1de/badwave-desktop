"use client";

import { useEffect } from "react";
import { BsPauseFill, BsPlayFill } from "react-icons/bs";
import { AiFillStepBackward, AiFillStepForward } from "react-icons/ai";
import { HiSpeakerWave, HiSpeakerXMark } from "react-icons/hi2";
import { mediaControls } from "@/libs/electron-utils";

interface PlayerProps {
  playlists?: any[];
}

const Player: React.FC<PlayerProps> = ({ playlists = [] }) => {
  const isPlaying = false;
  const isMuted = false;

  // Electronのメディアコントロールを設定
  useEffect(() => {
    const unsubscribe = mediaControls.onMediaControl((action) => {
      switch (action) {
        case "play-pause":
          console.log("Play/Pause from system tray");
          break;
        case "next":
          console.log("Next from system tray");
          break;
        case "previous":
          console.log("Previous from system tray");
          break;
        default:
          break;
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div className="fixed bottom-0 bg-black w-full py-2 h-[80px] px-4 border-t border-white/5">
      <div className="grid grid-cols-2 md:grid-cols-3 h-full">
        <div className="flex w-full justify-start">
          <div className="flex items-center gap-x-4">
            <div className="hidden md:flex flex-col gap-y-1 overflow-hidden">
              <p className="text-white truncate">No song playing</p>
              <p className="text-neutral-400 text-sm truncate">No artist</p>
            </div>
          </div>
        </div>

        <div className="flex md:hidden col-auto w-full justify-end items-center">
          <div
            onClick={() => {}}
            className="h-10 w-10 flex items-center justify-center rounded-full bg-white p-1 cursor-pointer"
          >
            <BsPlayFill size={30} className="text-black" />
          </div>
        </div>

        <div className="hidden h-full md:flex justify-center items-center w-full max-w-[722px] gap-x-6">
          <AiFillStepBackward
            onClick={() => {}}
            size={30}
            className="text-neutral-400 cursor-pointer hover:text-white transition"
          />
          <div
            onClick={() => {}}
            className="flex items-center justify-center h-10 w-10 rounded-full bg-white p-1 cursor-pointer"
          >
            {isPlaying ? (
              <BsPauseFill size={30} className="text-black" />
            ) : (
              <BsPlayFill size={30} className="text-black" />
            )}
          </div>
          <AiFillStepForward
            onClick={() => {}}
            size={30}
            className="text-neutral-400 cursor-pointer hover:text-white transition"
          />
        </div>

        <div className="hidden md:flex w-full justify-end pr-2">
          <div className="flex items-center gap-x-2 w-[120px]">
            <div
              onClick={() => {}}
              className="cursor-pointer"
            >
              {isMuted ? (
                <HiSpeakerXMark size={34} className="text-neutral-400" />
              ) : (
                <HiSpeakerWave size={34} className="text-neutral-400" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Player;
