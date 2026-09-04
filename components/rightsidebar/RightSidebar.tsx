"use client";

import React, { useState, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import usePlayer from "@/hooks/player/usePlayer";
import useGetSongById from "@/hooks/data/useGetSongById";
import FullScreenLayout from "./FullScreenLayout";
import { getPlayableImagePath } from "@/libs/songUtils";
import { twMerge } from "tailwind-merge";
import { motion, useSpring } from "framer-motion";
import { useDrag } from "@use-gesture/react";
import { BsGripVertical, BsChevronLeft } from "react-icons/bs";
import { store } from "@/libs/electron/index";
import { ELECTRON_STORE_KEYS, SPRING_SIDEBAR } from "@/constants";

interface RightSidebarProps {
  children: React.ReactNode;
}

const RightSidebar: React.FC<RightSidebarProps> = ({ children }) => {
  const player = usePlayer();
  const pathname = usePathname();
  const isPulsePage = pathname === "/pulse";

  // まずローカルストアから曲を取得
  const localCurrentSong = useMemo(() => {
    if (!player.activeId) return null;
    return player.getLocalSong(player.activeId);
  }, [player.activeId, player.getLocalSong]);

  const nextSongId = player.getNextSongId();
  const localNextSong = useMemo(() => {
    if (!nextSongId) return null;
    return player.getLocalSong(nextSongId);
  }, [nextSongId, player.getLocalSong]);

  // ローカルストアになければ useGetSongById でフェッチ（オンライン時のみ実行される）
  const { song: fetchedCurrentSong } = useGetSongById(
    localCurrentSong ? undefined : player.activeId
  );
  const { song: fetchedNextSong } = useGetSongById(
    localNextSong ? undefined : nextSongId
  );

  // 最終的な曲を決定（ローカル優先）
  const currentSong = localCurrentSong || fetchedCurrentSong;
  const nextTrack = localNextSong || fetchedNextSong;

  // pulseページではRightSidebarを非表示
  const showRightSidebar = currentSong && nextTrack && !isPulsePage;

  // サイドバーの幅の状態管理
  const [sidebarWidth, setSidebarWidth] = useState(384); // 初期値 w-96 (384px)
  const [isClosed, setIsClosed] = useState(false); // サイドバーの開閉状態
  const MIN_WIDTH = 300; // 最小幅
  const MAX_WIDTH = 600; // 最大幅
  const CLOSE_THRESHOLD = MIN_WIDTH / 2; // 閉じる閾値（最小幅の半分）

  // Electronのストアからサイドバー幅と開閉状態を読み込む
  useEffect(() => {
    const loadSidebarState = async () => {
      try {
        const [savedWidth, savedClosed] = await Promise.all([
          store.get<number>(ELECTRON_STORE_KEYS.RIGHT_SIDEBAR_WIDTH),
          store.get<boolean>(ELECTRON_STORE_KEYS.RIGHT_SIDEBAR_CLOSED),
        ]);

        if (savedWidth && savedWidth >= MIN_WIDTH && savedWidth <= MAX_WIDTH) {
          setSidebarWidth(savedWidth);
        }

        if (savedClosed !== undefined) {
          setIsClosed(savedClosed);
        }
      } catch (error) {
        console.error("サイドバー状態の読み込みに失敗しました:", error);
      }
    };

    loadSidebarState();
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

  // サイドバーの開閉状態をElectronのストアに保存
  useEffect(() => {
    const saveClosedState = async () => {
      try {
        await store.set(ELECTRON_STORE_KEYS.RIGHT_SIDEBAR_CLOSED, isClosed);
      } catch (error) {
        console.error("サイドバーの開閉状態の保存に失敗しました:", error);
      }
    };

    saveClosedState();
  }, [isClosed]);

  // framer-motion の useSpring でアニメーション用の幅を管理
  const width = useSpring(isClosed ? 0 : sidebarWidth, SPRING_SIDEBAR);

  // 状態が変化したときに幅を更新
  useEffect(() => {
    width.set(isClosed ? 0 : sidebarWidth);
  }, [isClosed, sidebarWidth, width]);

  // サイドバーを開く関数
  const openSidebar = () => {
    setIsClosed(false);
  };

  // ドラッグ操作の設定
  const bind = useDrag(
    ({ movement: [mx], last }) => {
      // サイドバーが閉じている場合はドラッグ操作を無効化
      if (isClosed) return;

      // ドラッグ中は幅を更新
      const newWidth = Math.max(0, Math.min(MAX_WIDTH, sidebarWidth - mx));
      // ドラッグ中はバネをスキップして即時追従させるために set を直接呼ぶ
      // (useSpring の戻り値は MotionValue なので jump: true で即時移動可能)
      width.jump(newWidth);

      // ドラッグ終了時に状態を更新
      if (last) {
        // 閾値以下になったら閉じる（アニメーションで0になるように遷移）
        if (newWidth < CLOSE_THRESHOLD) {
          setIsClosed(true);
          // 閉じるときはサイドバー幅を維持（次に開くときに元の幅に戻る）
        } else {
          // 最小幅以下の場合は、スムーズにMIN_WIDTHまでアニメーション
          const adjustedWidth = Math.max(MIN_WIDTH, newWidth);
          setSidebarWidth(adjustedWidth);
          // width.set()で自然なバネアニメーションを発生させる
          width.set(adjustedWidth);
        }
      }
    },
    { axis: "x" }
  );

  // サイドバーが閉じていてトグルボタンが表示される場合のパディング
  const shouldShowToggle = showRightSidebar && isClosed;

  return (
    <div className={twMerge(`flex h-full`, player.activeId && "h-full")}>
      <main
        className={twMerge(
          "h-full flex-1 overflow-y-auto bg-[#0a0a0f]",
          // サイドバーが閉じていてトグルボタンが表示される場合は、
          // スクロールバーとトグルボタンが重ならないように右側のマージンを追加
          shouldShowToggle && "xl:mr-8",
        )}
      >
        {children}
      </main>
      {showRightSidebar && (
        <div className="relative hidden xl:flex h-full">
          {/* 閉じている場合のトグルボタン - 固定幅のコンテナ内に配置 */}
          {isClosed && (
            <div
              data-testid="sidebar-toggle"
              onClick={openSidebar}
              className={twMerge(
                "w-8 h-full cursor-pointer",
                "flex items-center justify-center",
                "bg-gradient-to-l from-theme-500/10 to-transparent",
                "hover:from-theme-500/20 transition-all duration-300",
                "border-l border-theme-500/20",
              )}
            >
              <BsChevronLeft className="text-theme-500/60 hover:text-white transition-colors" />
            </div>
          )}

          {/* リサイズハンドル - サイドバーが開いている時のみ表示 */}
          {!isClosed && (
            <div
              {...bind()}
              className="absolute left-0 top-0 bottom-0 w-6 cursor-ew-resize flex items-center justify-center z-50 group/handle"
            >
              <div className="w-0.5 h-12 bg-theme-500/20 group-hover/handle:bg-theme-500/60 transition-colors" />
            </div>
          )}

          {/* リサイズ可能なサイドバー */}
          <motion.div
            style={{ width }}
            className={twMerge(
              "h-full overflow-hidden",
              !isClosed && "pl-6 pr-2 pt-2 pb-2",
              "bg-[#0a0a0f]/95",
              "backdrop-blur-3xl border-l border-theme-500/20 shadow-[-10px_0_30px_rgba(0,0,0,0.8)]",
              "z-40 relative font-mono",
            )}
          >
            {/* スキャンライン装飾 */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.02] bg-[length:100%_4px] bg-[linear-gradient(rgba(255,255,255,0)_50%,rgba(0,0,0,0.5)_50%)]" />

            {!isClosed && (
              <FullScreenLayout
                song={currentSong!}
                videoPath={currentSong?.video_path}
                imagePath={currentSong ? getPlayableImagePath(currentSong) : undefined}
                nextSong={nextTrack}
                nextImagePath={nextTrack ? getPlayableImagePath(nextTrack) : undefined}
              />
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default RightSidebar;
