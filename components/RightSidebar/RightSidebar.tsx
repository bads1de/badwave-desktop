"use client";

import React, { useState, useEffect } from "react";
import usePlayer from "@/hooks/player/usePlayer";
import useGetSongById from "@/hooks/data/useGetSongById";
import FullScreenLayout from "./FullScreenLayout";
import { twMerge } from "tailwind-merge";
import { animated, useSpring } from "@react-spring/web";
import { useDrag } from "@use-gesture/react";
import { BsGripVertical } from "react-icons/bs";
import { store } from "@/libs/electron-utils";
import { ELECTRON_STORE_KEYS } from "@/constants";

interface RightSidebarProps {
  children: React.ReactNode;
}

const RightSidebar: React.FC<RightSidebarProps> = ({ children }) => {
  const player = usePlayer();
  const { song } = useGetSongById(player.activeId);
  const { song: nextSong } = useGetSongById(player.getNextSongId());

  const currentSong = song;
  const nextTrack = nextSong;

  const showRightSidebar = currentSong && nextTrack;

  // サイドバーの幅の状態管理
  const [sidebarWidth, setSidebarWidth] = useState(384); // 初期値 w-96 (384px)
  const MIN_WIDTH = 300; // 最小幅
  const MAX_WIDTH = 600; // 最大幅

  // Electronのストアからサイドバー幅を読み込む
  useEffect(() => {
    const loadSidebarWidth = async () => {
      try {
        const savedWidth = await store.get<number>(
          ELECTRON_STORE_KEYS.RIGHT_SIDEBAR_WIDTH
        );
        if (savedWidth && savedWidth >= MIN_WIDTH && savedWidth <= MAX_WIDTH) {
          setSidebarWidth(savedWidth);
        }
      } catch (error) {
        console.error("サイドバー幅の読み込みに失敗しました:", error);
      }
    };

    loadSidebarWidth();
  }, []);

  // サイドバー幅をElectronのストアに保存
  useEffect(() => {
    const saveSidebarWidth = async () => {
      try {
        await store.set(ELECTRON_STORE_KEYS.RIGHT_SIDEBAR_WIDTH, sidebarWidth);
      } catch (error) {
        console.error("サイドバー幅の保存に失敗しました:", error);
      }
    };

    saveSidebarWidth();
  }, [sidebarWidth]);

  // react-springでアニメーション用のスタイルを設定
  const [{ width }, api] = useSpring(() => ({
    width: sidebarWidth,
    config: { tension: 300, friction: 30 },
  }));

  // ドラッグ操作の設定
  const bind = useDrag(
    ({ movement: [mx], first, last }) => {
      // ドラッグ開始時の幅を記録
      if (first) {
        api.start({ width: sidebarWidth });
      }

      // ドラッグ中は幅を更新
      const newWidth = Math.max(
        MIN_WIDTH,
        Math.min(MAX_WIDTH, sidebarWidth - mx)
      );
      api.start({ width: newWidth, immediate: true });

      // ドラッグ終了時に状態を更新
      if (last) {
        setSidebarWidth(newWidth);
      }
    },
    { axis: "x" }
  );

  return (
    <div className={twMerge(`flex h-full`, player.activeId && "h-full")}>
      <main className="h-full flex-1 overflow-y-auto pr-2">{children}</main>
      {showRightSidebar && (
        <div className="relative hidden xl:flex h-full">
          {/* リサイズハンドル - 左端ではなく右サイドバーの左側に配置 */}
          <div
            {...bind()}
            className="absolute left-0 top-0 bottom-0 w-6 cursor-ew-resize flex items-center justify-center z-50"
          >
            <BsGripVertical className="text-neutral-400" />
          </div>

          {/* リサイズ可能なサイドバー - 左側にパディングを追加してリサイズハンドルのスペースを確保 */}
          <animated.div
            style={{ width }}
            className={twMerge(
              "h-full pl-6 pr-2 pt-2 pb-2 overflow-hidden",
              "bg-gradient-to-br from-black/95 via-neutral-900/90 to-neutral-900/85",
              "backdrop-blur-2xl border-l border-white/[0.02] shadow-2xl shadow-black/20",
              "transition-all duration-500 z-40"
            )}
          >
            <FullScreenLayout
              song={currentSong!}
              videoPath={song?.video_path}
              imagePath={song?.image_path}
              nextSong={nextTrack}
              nextImagePath={nextTrack?.image_path}
            />
          </animated.div>
        </div>
      )}
    </div>
  );
};

export default RightSidebar;
