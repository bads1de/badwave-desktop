"use client";

import { Song } from "@/types";
import { twMerge } from "tailwind-merge";
import Image from "next/image";
import Link from "next/link";
import { CiHeart, CiPlay1 } from "react-icons/ci";
import ScrollingText from "../common/ScrollingText";
import { memo, useCallback, useState, useEffect, useMemo } from "react";
import useDownloadSong from "@/hooks/utils/useDownloadSong";
import { IoCloudOffline } from "react-icons/io5";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";
import { getPlayableImagePath } from "@/libs/songUtils";
import DownloadIndicator from "../common/DownloadIndicator";
import { ROUTES } from "@/constants";

interface SongItemProps {
  onClick: (id: string) => void;
  data: Song;
}

const SongItem: React.FC<SongItemProps> = memo(({ onClick, data }) => {
  const { isOnline, isInitialized } = useNetworkStatus();

  // まずプロパティを確認、なければフックにフォールバック
  // is_downloaded が既に true なら、フックは IPC をスキップする
  const { isDownloaded: hookIsDownloaded } = useDownloadSong(data);
  const isDownloaded = data.is_downloaded ?? hookIsDownloaded;

  // Hydrationエラー回避: 初回レンダリングは常に再生可能として表示
  // クライアントマウント後に実際の状態を反映
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Hydration完了かつネットワーク状態が初期化されるまでは再生可能として表示
  const isPlayable = !isHydrated || !isInitialized || isOnline || isDownloaded;

  // 画像パス（ダウンロード済みならローカルパスを優先）
  const imagePath = useMemo(() => getPlayableImagePath(data), [data]);

  // クリックハンドラーをメモ化
  const handleClick = useCallback(() => {
    if (!isPlayable) return; // 再生不可の場合はクリックを無視
    onClick(data.id);
  }, [onClick, data.id, isPlayable]);

  return (
    <div
      className={twMerge(
        "relative group flex flex-col items-center justify-center rounded-none overflow-hidden bg-[#0a0a0f] transition-all duration-500 aspect-[9/16] border border-theme-500/20 hover:border-theme-500/60 hover:shadow-[0_0_25px_rgba(var(--theme-500),0.2)] cyber-glitch font-mono",
        isPlayable ? "cursor-pointer hover:bg-theme-500/5" : "cursor-not-allowed",
      )}
    >
      {/* HUDコーナー装飾 */}
      <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-theme-500/40 z-20 group-hover:border-theme-500 transition-colors" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-theme-500/40 z-20 group-hover:border-theme-500 transition-colors" />

      <div className="relative w-full h-full">
        {imagePath && (
          <Image
            className={twMerge(
              "object-cover w-full h-full transition-all duration-700",
              isPlayable
                ? "group-hover:scale-110 group-hover:opacity-60 grayscale-[30%] group-hover:grayscale-0"
                : "grayscale opacity-30",
            )}
            src={imagePath}
            fill
            alt="Image"
            onClick={handleClick}
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width:1280px) 25vw, 20vw"
          />
        )}

        {/* スキャンライン */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-10 bg-[length:100%_3px] bg-[linear-gradient(rgba(255,255,255,0)_50%,rgba(0,0,0,0.5)_50%)]" />

        {/* オフラインで再生不可の場合のオーバーレイ */}
        {!isPlayable && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
            <div className="text-center font-mono">
              <IoCloudOffline
                size={32}
                className="text-theme-500/40 mx-auto mb-2"
              />
              <span className="text-theme-500/40 text-[10px] uppercase tracking-widest">
                [ OFFLINE_LOCKED ]
              </span>
            </div>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/80 to-transparent z-20">
          <Link
            href={ROUTES.SONGS_DETAIL(data.id)}
            className={twMerge(
              "w-full block mb-1",
              !isPlayable && "pointer-events-none",
            )}
          >
            <div
              className={twMerge(
                "font-black truncate text-[10px] uppercase tracking-widest transition-colors",
                isPlayable
                  ? "text-theme-300 hover:text-white group-hover:drop-shadow-[0_0_8px_rgba(var(--theme-500),0.8)]"
                  : "text-theme-500/20",
              )}
            >
              <ScrollingText text={data.title} />
            </div>
          </Link>

          <p
            className={twMerge(
              "text-[8px] truncate uppercase tracking-tighter transition-colors",
              isPlayable
                ? "text-theme-500/60 group-hover:text-theme-300"
                : "text-theme-500/10",
            )}
          >
            // AUTH: {data.author}
          </p>

          <div className="flex items-center justify-between mt-3 pt-2 border-t border-theme-500/10">
            <div
              className={twMerge(
                "flex items-center text-[8px] font-black uppercase tracking-widest transition-colors",
                isPlayable
                  ? "text-theme-500/40 group-hover:text-theme-400"
                  : "text-theme-500/10",
              )}
            >
              <CiPlay1 size={10} className="mr-1" />
              <span>{data.count}_PLAYS</span>
            </div>
            <div className="flex items-center gap-x-2">
              <div
                className={twMerge(
                  "flex items-center text-[8px] font-black uppercase tracking-widest transition-colors",
                  isPlayable
                    ? "text-theme-500/40 group-hover:text-theme-400"
                    : "text-theme-500/10",
                )}
              >
                <CiHeart size={10} className="mr-1" />
                <span>{data.like_count}_VAL</span>
              </div>
              {/* ダウンロード状態を表示 */}
              <DownloadIndicator song={data} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

// 表示名を設定
SongItem.displayName = "SongItem";

export default SongItem;
