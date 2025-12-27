"use client";

import { AiOutlineBars, AiOutlinePlus } from "react-icons/ai";
import { RiPlayListFill } from "react-icons/ri";
import { GiMicrophone } from "react-icons/gi";
import useAuthModal from "@/hooks/auth/useAuthModal";
import { useUser } from "@/hooks/auth/useUser";
import useUploadModal from "@/hooks/modal/useUploadModal";
import usePlaylistModal from "@/hooks/modal/usePlaylistModal";
import useSpotLightUploadModal from "@/hooks/modal/useSpotLightUpload";
import usePulseUploadModal from "@/hooks/modal/usePulseUploadModal";
import Hover from "../common/Hover";
import { checkIsAdmin } from "@/actions/checkAdmin";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import { RiPulseLine } from "react-icons/ri";

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
          return toast.error("管理者権限が必要です");
        }
        return uploadModal.onOpen();
      case "playlist":
        return playlistModal.onOpen();
      case "spotlight":
        if (!isAdmin) {
          return toast.error("管理者権限が必要です");
        }
        return spotlightUploadModal.onOpen();
      case "pulse":
        if (!isAdmin) {
          return toast.error("管理者権限が必要です");
        }
        return pulseUploadModal.onOpen();
    }
  };

  if (isCollapsed) {
    return (
      <div className="flex flex-col gap-3 px-1 pt-4">
        <Hover
          contentSize="w-auto px-3 py-2"
          side="right"
          description="プレイリストを作成"
        >
          <button className="w-full aspect-square rounded-xl bg-gradient-to-br from-neutral-800/80 to-neutral-900/80 backdrop-blur-lg border border-white/5 hover:border-theme-500/30 transition-all duration-500 flex items-center justify-center group relative overflow-hidden shadow-lg hover:shadow-theme-500/10">
            <div className="absolute inset-0 bg-gradient-to-br from-theme-500/10 via-theme-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
            <AiOutlineBars
              className="text-neutral-400 group-hover:text-white transition-all duration-300 transform group-hover:scale-110"
              size={20}
              onClick={() => openModal("playlist")}
            />
          </button>
        </Hover>

        <Hover
          contentSize="w-auto px-3 py-2"
          side="right"
          description="曲を追加"
        >
          <button className="w-full aspect-square rounded-xl bg-gradient-to-br from-neutral-800/80 to-neutral-900/80 backdrop-blur-lg border border-white/5 hover:border-theme-500/30 transition-all duration-500 flex items-center justify-center group relative overflow-hidden shadow-lg hover:shadow-theme-500/10">
            <div className="absolute inset-0 bg-gradient-to-br from-theme-500/10 via-theme-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
            <AiOutlinePlus
              className="text-neutral-400 group-hover:text-white transition-all duration-300 transform group-hover:scale-110"
              size={20}
              onClick={() => openModal("music")}
            />
          </button>
        </Hover>

        <Hover
          contentSize="w-auto px-3 py-2"
          side="right"
          description="スポットライトを作成"
        >
          <button
            onClick={() => openModal("spotlight")}
            className="w-full aspect-square rounded-xl bg-gradient-to-br from-neutral-800/80 to-neutral-900/80 backdrop-blur-lg border border-white/5 hover:border-theme-500/30 transition-all duration-500 flex items-center justify-center group relative overflow-hidden shadow-lg hover:shadow-theme-500/10"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-theme-500/10 via-theme-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
            <GiMicrophone
              className="text-neutral-400 group-hover:text-white transition-all duration-300 transform group-hover:scale-110"
              size={20}
            />
          </button>
        </Hover>

        <Hover
          contentSize="w-auto px-3 py-2"
          side="right"
          description="Pulseを投稿"
        >
          <button
            onClick={() => openModal("pulse")}
            className="w-full aspect-square rounded-xl bg-gradient-to-br from-neutral-800/80 to-neutral-900/80 backdrop-blur-lg border border-white/5 hover:border-theme-500/30 transition-all duration-500 flex items-center justify-center group relative overflow-hidden shadow-lg hover:shadow-theme-500/10"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-theme-500/10 via-theme-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
            <RiPulseLine
              className="text-neutral-400 group-hover:text-white transition-all duration-300 transform group-hover:scale-110"
              size={20}
            />
          </button>
        </Hover>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-3 pt-10">
      <div className="grid grid-cols-1 gap-3">
        <button
          onClick={() => openModal("playlist")}
          className="group w-full p-4 rounded-xl bg-gradient-to-br from-neutral-800/80 to-neutral-900/80 backdrop-blur-lg border border-white/5 hover:border-theme-500/30 transition-all duration-500 relative overflow-hidden shadow-lg hover:shadow-theme-500/10"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-theme-500/10 via-theme-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
          <div className="relative flex items-center gap-4">
            <div className="p-3 rounded-xl bg-theme-500/10 group-hover:bg-theme-500/20 transition-all duration-500 shadow-inner">
              <RiPlayListFill
                className="text-theme-500 group-hover:text-theme-300 transition-all duration-300 transform group-hover:scale-110"
                size={24}
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-300">
                プレイリストを作成
              </span>
              <span className="text-xs text-neutral-400">
                お気に入りの曲をまとめよう
              </span>
            </div>
          </div>
        </button>

        <button
          onClick={() => openModal("music")}
          className="group w-full p-4 rounded-xl bg-gradient-to-br from-neutral-800/80 to-neutral-900/80 backdrop-blur-lg border border-white/5 hover:border-theme-500/30 transition-all duration-500 relative overflow-hidden shadow-lg hover:shadow-theme-500/10"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-theme-500/10 via-theme-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
          <div className="relative flex items-center gap-4">
            <div className="p-3 rounded-xl bg-theme-500/10 group-hover:bg-theme-500/20 transition-all duration-500 shadow-inner">
              <AiOutlinePlus
                className="text-theme-500 group-hover:text-theme-300 transition-all duration-300 transform group-hover:scale-110"
                size={24}
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-300">
                曲を追加
              </span>
              <span className="text-xs text-neutral-400">
                新しい曲をアップロード
              </span>
            </div>
          </div>
        </button>

        <button
          onClick={() => openModal("spotlight")}
          className="group w-full p-4 rounded-xl bg-gradient-to-br from-neutral-800/80 to-neutral-900/80 backdrop-blur-lg border border-white/5 hover:border-theme-500/30 transition-all duration-500 relative overflow-hidden shadow-lg hover:shadow-theme-500/10"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-theme-500/10 via-theme-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
          <div className="relative flex items-center gap-4">
            <div className="p-3 rounded-xl bg-theme-500/10 group-hover:bg-theme-500/20 transition-all duration-500 shadow-inner">
              <GiMicrophone
                className="text-theme-500 group-hover:text-theme-300 transition-all duration-300 transform group-hover:scale-110"
                size={24}
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-300">
                スポットライト
              </span>
              <span className="text-xs text-neutral-400">Spotlightを共有</span>
            </div>
          </div>
        </button>

        <button
          onClick={() => openModal("pulse")}
          className="group w-full p-4 rounded-xl bg-gradient-to-br from-neutral-800/80 to-neutral-900/80 backdrop-blur-lg border border-white/5 hover:border-theme-500/30 transition-all duration-500 relative overflow-hidden shadow-lg hover:shadow-theme-500/10"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-theme-500/10 via-theme-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
          <div className="relative flex items-center gap-4">
            <div className="p-3 rounded-xl bg-theme-500/10 group-hover:bg-theme-500/20 transition-all duration-500 shadow-inner">
              <RiPulseLine
                className="text-theme-500 group-hover:text-theme-300 transition-all duration-300 transform group-hover:scale-110"
                size={24}
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-300">
                Pulse
              </span>
              <span className="text-xs text-neutral-400">Pulseを投稿</span>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default Studio;
