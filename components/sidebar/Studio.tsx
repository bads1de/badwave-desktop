"use client";

import { AiOutlinePlus } from "react-icons/ai";
import { RiPlayListFill, RiPulseLine } from "react-icons/ri";
import { GiMicrophone } from "react-icons/gi";
import { BsWrench } from "react-icons/bs";
import useAuthModal from "@/hooks/auth/useAuthModal";
import { useUser } from "@/hooks/auth/useUser";
import useUploadModal from "@/hooks/modal/useUploadModal";
import usePlaylistModal from "@/hooks/modal/usePlaylistModal";
import useSpotLightUploadModal from "@/hooks/modal/useSpotLightUpload";
import usePulseUploadModal from "@/hooks/modal/usePulseUploadModal";
import Hover from "../common/Hover";
import { checkIsAdmin } from "@/actions/checkAdmin";
import toast from "react-hot-toast";
import { ERROR_MESSAGES } from "@/constants/errorMessages";
import { useEffect, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { twMerge } from "tailwind-merge";

interface StudioProps {
  isCollapsed: boolean;
}

const Studio: React.FC<StudioProps> = ({ isCollapsed }) => {
  const { user } = useUser();
  const authModal = useAuthModal();
  const uploadModal = useUploadModal();
  const playlistModal = usePlaylistModal();
  const spotlightUploadModal = useSpotLightUploadModal();
  const pulseUploadModal = usePulseUploadModal();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        const { isAdmin } = await checkIsAdmin();
        setIsAdmin(isAdmin);
      } else {
        setIsAdmin(false);
      }
    };
    checkAdminStatus();
  }, [user]);

  const openModal = (value: "music" | "playlist" | "spotlight" | "pulse") => {
    if (!user) {
      return authModal.onOpen();
    }

    switch (value) {
      case "music":
        if (!isAdmin) {
          return toast.error(ERROR_MESSAGES.ADMIN_REQUIRED);
        }
        return uploadModal.onOpen();
      case "playlist":
        return playlistModal.onOpen();
      case "spotlight":
        if (!isAdmin) {
          return toast.error(ERROR_MESSAGES.ADMIN_REQUIRED);
        }
        return spotlightUploadModal.onOpen();
      case "pulse":
        if (!isAdmin) {
          return toast.error(ERROR_MESSAGES.ADMIN_REQUIRED);
        }
        return pulseUploadModal.onOpen();
    }
  };

  if (!user) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div
          className={twMerge(
            "cursor-pointer transition-all duration-500 cyber-glitch relative group/item",
            isCollapsed
              ? "w-full flex items-center justify-center border-b border-transparent"
              : "flex h-auto w-full items-center gap-x-3 py-3 px-3 rounded-none",
            "border border-transparent text-theme-500/60 hover:text-white hover:bg-theme-500/5 hover:border-theme-500/30",
          )}
        >
          {/* HUD装飾コーナー */}
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-theme-500/0 group-hover/item:border-theme-500/40 transition-colors z-10" />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-theme-500/0 group-hover/item:border-theme-500/40 transition-colors z-10" />
          {isCollapsed ? (
            <Hover
              description="[ STUDIO ]"
              contentSize="w-auto px-3 py-2"
              side="right"
            >
              <div className="p-3 rounded-xl">
                <BsWrench
                  size={24}
                  className="transition-all duration-300 text-theme-500/60 group-hover:text-theme-300"
                />
              </div>
            </Hover>
          ) : (
            <>
              <BsWrench
                size={24}
                className="text-theme-500/60 group-hover:text-theme-300 transition-all duration-300 drop-shadow-[0_0_8px_rgba(var(--theme-500),0)] group-hover:drop-shadow-[0_0_8px_rgba(var(--theme-500),0.8)]"
              />
              <p className="truncate text-sm font-bold tracking-[0.2em] font-mono">
                [ STUDIO ]
              </p>
            </>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="start"
        className="w-56 p-2 bg-[#0a0a0f]/95 backdrop-blur-2xl border border-theme-500/40 shadow-[0_0_30px_rgba(0,0,0,0.8)] rounded-none"
      >
        <div className="flex flex-col gap-y-2 font-mono uppercase tracking-widest text-[10px]">
          <div className="flex items-center gap-2 text-[10px] text-theme-500/40 uppercase tracking-[0.4em] mb-1 border-b border-theme-500/10 pb-2 px-2 pt-1">
            <span>[ STUDIO_TOOLS ]</span>
          </div>
          <button
            onClick={() => openModal("playlist")}
            className="flex items-center gap-x-3 px-3 py-3 rounded-none transition-all duration-300 border border-transparent hover:border-theme-500/30 text-theme-500/60 hover:text-white hover:bg-theme-500/10 w-full text-left cyber-glitch"
          >
            <RiPlayListFill size={20} />
            <p className="font-bold">// INIT_PLAYLIST</p>
          </button>

          <button
            onClick={() => openModal("music")}
            className="flex items-center gap-x-3 px-3 py-3 rounded-none transition-all duration-300 border border-transparent hover:border-theme-500/30 text-theme-500/60 hover:text-white hover:bg-theme-500/10 w-full text-left cyber-glitch"
          >
            <AiOutlinePlus size={20} />
            <p className="font-bold">// INGEST_BINARY</p>
          </button>

          <button
            onClick={() => openModal("spotlight")}
            className="flex items-center gap-x-3 px-3 py-3 rounded-none transition-all duration-300 border border-transparent hover:border-theme-500/30 text-theme-500/60 hover:text-white hover:bg-theme-500/10 w-full text-left cyber-glitch"
          >
            <GiMicrophone size={20} />
            <p className="font-bold">// SPOTLIGHT_SYNC</p>
          </button>

          <button
            onClick={() => openModal("pulse")}
            className="flex items-center gap-x-3 px-3 py-3 rounded-none transition-all duration-300 border border-transparent hover:border-theme-500/30 text-theme-500/60 hover:text-white hover:bg-theme-500/10 w-full text-left cyber-glitch"
          >
            <RiPulseLine size={20} />
            <p className="font-bold">// PULSE_GEN</p>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default Studio;
