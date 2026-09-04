"use client";

import { Song } from "@/types";
import { BsThreeDots } from "react-icons/bs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import LikeButton from "@/components/LikeButton";
import DeletePlaylistSongsBtn from "@/components/playlist/DeletePlaylistSongsBtn";
import { useState, memo, useCallback } from "react";
import PreviewDownloadModal from "@/components/modals/DownloadPreviewModal";
import useDownload from "@/hooks/data/useDownload";
import { Download } from "lucide-react";
import { downloadFile } from "@/libs/utils";
import { useUser } from "@/hooks/auth/useUser";
import useDownloadSong from "@/hooks/utils/useDownloadSong";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";
import { IoCloudDownloadOutline, IoTrashOutline } from "react-icons/io5";
import { isLocalSong } from "@/libs/songUtils";
import DisabledOverlay from "../common/DisabledOverlay";

interface SongOptionsPopoverProps {
  song: Song;
  playlistId?: string;
  playlistUserId?: string;
}

const SongOptionsPopover: React.FC<SongOptionsPopoverProps> = memo(
  ({ song, playlistId, playlistUserId }) => {
    const { user } = useUser();
    const { isOnline } = useNetworkStatus();
    const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
    const { fileUrl: audioUrl } = useDownload(song.song_path);
    const [isLoading, setIsLoading] = useState(false);

    // ダウンロードフック
    const { download, remove, isDownloaded, isDownloading } =
      useDownloadSong(song);

    const isLocal = isLocalSong(song);

    // ダウンロードハンドラーをメモ化
    const handleDownloadClick = useCallback(
      async (type: "audio" | "video") => {
        setIsLoading(true);

        if (type === "audio" && song?.song_path && audioUrl) {
          await downloadFile(audioUrl, `${song.title || "Untitled"}.mp3`);
        }

        if (type === "video" && song?.video_path) {
          await downloadFile(
            song.video_path,
            `${song.title || "Untitled"}.mp4`,
          );
        }

        setIsLoading(false);
      },
      [audioUrl, song?.song_path, song?.title, song?.video_path],
    );

    const isPlaylistCreator =
      playlistId && playlistUserId && user?.id === playlistUserId;

    // オフライン時のメニューを表示しない
    if (!isOnline) {
      return null;
    }

    // ダウンロード以外のオプションが表示されるか確認
    const hasOtherOptions = user || isPlaylistCreator;

    return (
      <>
        <Popover>
          <PopoverTrigger asChild>
            <button
              className="text-neutral-400 cursor-pointer hover:text-white transition-all duration-300 drop-shadow-[0_0_5px_rgba(var(--theme-500),0.3)]"
              aria-label="More Options"
            >
              <BsThreeDots size={20} />
            </button>
          </PopoverTrigger>
          <PopoverContent
            side="left"
            className="w-56 p-0 bg-[#0a0a0f] border-theme-500/40 font-mono shadow-[0_0_30px_rgba(0,0,0,0.8)] rounded-none"
          >
            <div className="flex flex-col text-[10px] uppercase tracking-widest">
              <div className="px-4 py-3">
                <DisabledOverlay disabled={isLocal}>
                  <LikeButton
                    songId={song.id}
                    songType={"regular"}
                    showText={true}
                    disabled={isLocal}
                    size={18}
                  />
                </DisabledOverlay>
              </div>

              {isPlaylistCreator && (
                <div className="px-4 py-3 border-t border-theme-500/10">
                  <DisabledOverlay disabled={isLocal}>
                    <DeletePlaylistSongsBtn
                      songId={song.id}
                      playlistId={playlistId}
                      showText={true}
                      disabled={isLocal}
                    />
                  </DisabledOverlay>
                </div>
              )}

              <div
                className={`px-4 py-3 ${
                  hasOtherOptions ? "border-t border-theme-500/10" : ""
                }`}
              >
                <button
                  className="w-full flex items-center text-theme-500/60 hover:text-white transition-all duration-300 group"
                  onClick={() => setIsDownloadModalOpen(true)}
                >
                  <Download
                    size={16}
                    className="mr-3 group-hover:text-theme-500"
                  />
                  // EXTRACT_ASSET
                </button>
              </div>

              {/* 繧ｪ繝輔Λ繧､繝ｳ讖溯・ (Phase 2霑ｽ蜉 - 繝ｭ繝ｼ繧ｫ繝ｫ譖ｲ莉･螟悶・縺ｿ) */}
              {!isLocal && (
                <div className="px-4 py-3 border-t border-theme-500/10">
                  {isDownloaded ? (
                    <button
                      className="w-full flex items-center text-red-500/60 hover:text-red-400 transition-all duration-300 group"
                      onClick={() => remove()}
                      disabled={isDownloading}
                    >
                      <IoTrashOutline
                        size={16}
                        className="mr-3 group-hover:text-red-500"
                      />
                      // PURGE_CACHE
                    </button>
                  ) : (
                    <button
                      className="w-full flex items-center text-theme-500/60 hover:text-white transition-all duration-300 group"
                      onClick={() => download()}
                      disabled={isDownloading}
                    >
                      <IoCloudDownloadOutline
                        size={16}
                        className="mr-3 group-hover:text-theme-500"
                      />
                      {isDownloading ? "// SYNCING..." : "// SAVE_OFFLINE"}
                    </button>
                  )}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        <PreviewDownloadModal
          isOpen={isDownloadModalOpen}
          onClose={() => setIsDownloadModalOpen(false)}
          title={song.title}
          audioUrl={audioUrl || undefined}
          videoUrl={song.video_path || undefined}
          handleDownloadClick={handleDownloadClick}
        />
      </>
    );
  },
);

// 表示名を設定
SongOptionsPopover.displayName = "SongOptionsPopover";

export default SongOptionsPopover;

