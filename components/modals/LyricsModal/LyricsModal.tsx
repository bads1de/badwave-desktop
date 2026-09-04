"use client";

import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { IoMdClose } from "react-icons/io";
import { HiOutlineQueueList } from "react-icons/hi2";
import { Song } from "@/types";
import useLyricsModalStore from "@/hooks/stores/useLyricsModalStore";
import useAudioPlayer from "@/hooks/audio/useAudioPlayer";
import SyncedLyrics from "@/components/lyrics/SyncedLyrics";
import LyricsModalArtwork from "./LyricsModalArtwork";
import LyricsModalControls from "./LyricsModalControls";
import { isLocalSong, getPlayablePath } from "@/libs/songUtils";

interface LyricsModalProps {
  song: Song;
}

const LyricsModal: React.FC<LyricsModalProps> = ({ song }) => {
  const { isOpen, closeModal } = useLyricsModalStore();

  // ローカル曲の場合はローカルパスを使用
  const playablePath = getPlayablePath(song);

  const {
    formattedCurrentTime,
    formattedDuration,
    currentTime,
    duration,
    isPlaying,
    handlePlay,
    handleSeek,
    onPlayNext,
    onPlayPrevious,
  } = useAudioPlayer(playablePath, song);

  // ローカル曲の場合は歌詞がない可能性が高い
  const isLocal = isLocalSong(song);
  const lyrics = isLocal
    ? "ローカルファイルの歌詞は利用できません"
    : (song?.lyrics ?? "歌詞はありません");

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <Dialog.Portal>
        {/* 繧ｪ繝ｼ繝舌・繝ｬ繧､ */}
        <Dialog.Overlay
          className="
            fixed inset-0 z-[100]
            bg-black
            data-[state=open]:animate-in
            data-[state=closed]:animate-out
            data-[state=closed]:fade-out-0
            data-[state=open]:fade-in-0
            duration-300
          "
        />

        {/* 繝｡繧､繝ｳ繧ｳ繝ｳ繝・Φ繝・*/}
        <Dialog.Content
          className="
            fixed inset-0 z-[101]
            w-full h-full
            bg-black
            data-[state=open]:animate-in
            data-[state=closed]:animate-out
            data-[state=closed]:fade-out-0
            data-[state=open]:fade-in-0
            data-[state=closed]:zoom-out-95
            data-[state=open]:zoom-in-95
            duration-300
            flex flex-col
            overflow-hidden
          "
        >
          {/* 繧｢繧ｯ繧ｻ繧ｷ繝薙Μ繝・ぅ逕ｨ縺ｮ髱櫁｡ｨ遉ｺ繧ｿ繧､繝医Ν */}
          <Dialog.Title className="sr-only">Lyrics</Dialog.Title>

          {/* 繝倥ャ繝繝ｼ・亥承荳翫・繝懊ち繝ｳ・・*/}
          <div className="absolute top-0 right-0 z-10 p-4 flex items-center gap-2">
            {/* キューボタン */}
            <button
              className="
                rounded-full p-2.5
                bg-white/10 backdrop-blur-sm
                border border-white/10
                text-white/70
                hover:text-white hover:bg-white/20
                transition-all duration-200
              "
              aria-label="Queue"
            >
              <HiOutlineQueueList size={20} />
            </button>

            {/* 閉じるボタン */}
            <Dialog.Close asChild>
              <button
                className="
                  rounded-full p-2.5
                  bg-white/10 backdrop-blur-sm
                  border border-white/10
                  text-white/70
                  hover:text-white hover:bg-white/20
                  transition-all duration-200
                "
                aria-label="Close"
              >
                <IoMdClose size={20} />
              </button>
            </Dialog.Close>
          </div>

          {/* 繝｡繧､繝ｳ繧ｨ繝ｪ繧｢・亥ｷｦ・壹い繝ｼ繝医Ρ繝ｼ繧ｯ縲∝承・壽ｭ瑚ｩ橸ｼ・*/}
          <div className="flex flex-1 overflow-hidden">
            {/* 左側：アートワーク */}
            <div className="w-1/2 h-full">
              <LyricsModalArtwork song={song} />
            </div>

            {/* 右側：歌詞 */}
            <div className="w-1/2 h-full flex flex-col bg-black/40 backdrop-blur-sm">
              {/* LYRICS ラベル */}
              <div className="px-8 pt-6 pb-2">
                <span className="text-xs font-medium tracking-[0.3em] text-neutral-400 uppercase">
                  Lyrics
                </span>
              </div>

              {/* 豁瑚ｩ槭せ繧ｯ繝ｭ繝ｼ繝ｫ繧ｨ繝ｪ繧｢ */}
              <div className="flex-1 overflow-y-auto custom-scrollbar px-8 pb-8">
                <SyncedLyrics lyrics={lyrics} />
              </div>
            </div>
          </div>

          {/* 荳矩Κ・壹さ繝ｳ繝医Ο繝ｼ繝ｫ繝代ロ繝ｫ */}
          <LyricsModalControls
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            formattedCurrentTime={formattedCurrentTime}
            formattedDuration={formattedDuration}
            handlePlay={handlePlay}
            handleSeek={handleSeek}
            onPlayPrevious={onPlayPrevious}
            onPlayNext={onPlayNext}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default LyricsModal;

