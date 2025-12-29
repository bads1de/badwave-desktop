"use client";

import { Song } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { CiHeart, CiPlay1 } from "react-icons/ci";
import ScrollingText from "../common/ScrollingText";
import { memo, useCallback, useState, useEffect, useMemo } from "react";
import useDownloadSong from "@/hooks/utils/useDownloadSong";
import { IoCloudDone, IoCloudOffline } from "react-icons/io5";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";
import { getPlayableImagePath } from "@/libs/songUtils";

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
      className={`
        relative
        group
        flex
        flex-col
        items-center
        justify-center
        rounded-xl
        overflow-hidden
        bg-gradient-to-b
        from-gray-900/10
        to-gray-900/20
        transition-all
        duration-300
        aspect-[9/16]
        ${
          isPlayable
            ? "cursor-pointer hover:from-gray-800/20 hover:to-gray-800/30"
            : "cursor-not-allowed"
        }
      `}
    >
      <div className="relative w-full h-full">
        {imagePath && (
          <Image
            className={`object-cover w-full h-full transition-all duration-500 ${
              isPlayable ? "group-hover:scale-110" : "grayscale opacity-50"
            }`}
            src={imagePath}
            fill
            alt="Image"
            onClick={handleClick}
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width:1280px) 25vw, 20vw"
          />
        )}

        {/* オフラインで再生不可の場合のオーバーレイ */}
        {!isPlayable && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
            <div className="text-center">
              <IoCloudOffline
                size={32}
                className="text-gray-400 mx-auto mb-2"
              />
              <span className="text-gray-400 text-xs">
                オフライン時は再生不可
              </span>
            </div>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
          <Link
            href={`/songs/${data.id}`}
            className={`w-full block ${
              !isPlayable ? "pointer-events-none" : ""
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div
              className={`font-medium truncate text-sm transition-colors ${
                isPlayable
                  ? "text-gray-100 hover:text-gray-300 group-hover:text-white group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                  : "text-gray-500"
              }`}
            >
              <ScrollingText text={data.title} />
            </div>
          </Link>

          <p
            className={`text-xs mt-1 truncate transition-colors ${
              isPlayable
                ? "text-gray-400 hover:text-gray-300 group-hover:text-white group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                : "text-gray-600"
            }`}
          >
            {data.author}
          </p>

          <div className="flex items-center justify-start mt-2 space-x-4">
            <div
              className={`flex items-center transition-colors ${
                isPlayable
                  ? "text-gray-400 hover:text-gray-300 group-hover:text-white group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                  : "text-gray-600"
              }`}
            >
              <CiPlay1 size={14} />
              <span className="ml-1 text-xs">{data.count}</span>
            </div>
            <div
              className={`flex items-center transition-colors ${
                isPlayable
                  ? "text-gray-400 hover:text-gray-300 group-hover:text-white group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                  : "text-gray-600"
              }`}
            >
              <CiHeart size={14} />
              <span className="ml-1 text-xs">{data.like_count}</span>
            </div>
            {/* ダウンロード状態を表示 */}
            <DownloadIndicator song={data} />
          </div>
        </div>
      </div>
    </div>
  );
});

const DownloadIndicator = ({ song }: { song: Song }) => {
  // まずプロパティを確認、なければフックにフォールバック
  const { isDownloaded: hookIsDownloaded } = useDownloadSong(song);
  const isDownloaded = song.is_downloaded ?? hookIsDownloaded;

  if (!isDownloaded) return null;

  return (
    <div className="flex items-center text-theme-500 drop-shadow-[0_0_8px_rgba(var(--theme-500),0.6)]">
      <IoCloudDone size={14} />
    </div>
  );
};

// 表示名を設定
SongItem.displayName = "SongItem";

export default SongItem;
