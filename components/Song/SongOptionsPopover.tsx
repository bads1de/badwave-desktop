"use client";

import { Song } from "@/types";
import { BsThreeDots } from "react-icons/bs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import LikeButton from "@/components/LikeButton";
import DeletePlaylistSongsBtn from "@/components/Playlist/DeletePlaylistSongsBtn";
import { useState, memo, useCallback } from "react";
import PreviewDownloadModal from "@/components/Modals/DownloadPreviewModal";
import useDownload from "@/hooks/data/useDownload";
import { Download } from "lucide-react";
import { downloadFile } from "@/libs/helpers";
import { useUser } from "@/hooks/auth/useUser";
import useDownloadSong from "@/hooks/utils/useDownloadSong";
import { IoCloudDownloadOutline, IoTrashOutline } from "react-icons/io5";

interface SongOptionsPopoverProps {
  song: Song;
  playlistId?: string;
  playlistUserId?: string;
}

const SongOptionsPopover: React.FC<SongOptionsPopoverProps> = memo(
  ({ song, playlistId, playlistUserId }) => {
    const { user } = useUser();
    const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
    const { fileUrl: audioUrl } = useDownload(song.song_path);
    const [isLoading, setIsLoading] = useState(false);

    // オフラインダウンロードフック
    const { download, remove, isDownloaded, isDownloading } =
      useDownloadSong(song);

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
            `${song.title || "Untitled"}.mp4`
          );
        }

        setIsLoading(false);
      },
      [audioUrl, song?.song_path, song?.title, song?.video_path]
    );

    const isPlaylistCreator =
      playlistId && playlistUserId && user?.id === playlistUserId;

    // ダウンロード以外のオプションが表示されるかどうかを確認
    const hasOtherOptions = user || isPlaylistCreator;

    return (
      <>
        <Popover>
          <PopoverTrigger asChild>
            <button
              className="text-neutral-400 cursor-pointer hover:text-white transition"
              aria-label="More Options"
            >
              <BsThreeDots size={20} />
            </button>
          </PopoverTrigger>
          <PopoverContent
            side="left"
            className="w-48 p-0 bg-neutral-800 border-neutral-700"
          >
            <div className="flex flex-col text-sm">
              {user && (
                <div className="px-4 py-3">
                  <LikeButton
                    songId={song.id}
                    songType={"regular"}
                    showText={true}
                  />
                </div>
              )}

              {isPlaylistCreator && (
                <div className="px-4 py-3 border-t border-neutral-700">
                  <DeletePlaylistSongsBtn
                    songId={song.id}
                    playlistId={playlistId}
                    showText={true}
                  />
                </div>
              )}
              <div
                className={`px-4 py-3 ${
                  hasOtherOptions ? "border-t border-neutral-700" : ""
                }`}
              >
                <button
                  className="w-full flex items-center text-neutral-400 cursor-pointer hover:text-white hover:filter hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all duration-300"
                  onClick={() => setIsDownloadModalOpen(true)}
                >
                  <Download size={28} className="mr-2" />
                  ファイルを保存
                </button>
              </div>

              {/* オフライン機能 (Phase 2追加) */}
              <div className="px-4 py-3 border-t border-neutral-700">
                {isDownloaded ? (
                  <button
                    className="w-full flex items-center text-red-400 cursor-pointer hover:text-red-300 transition-all duration-300"
                    onClick={() => remove()}
                    disabled={isDownloading}
                  >
                    <IoTrashOutline size={24} className="mr-2" />
                    キャッシュ削除
                  </button>
                ) : (
                  <button
                    className="w-full flex items-center text-neutral-400 cursor-pointer hover:text-white hover:filter hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all duration-300"
                    onClick={() => download()}
                    disabled={isDownloading}
                  >
                    <IoCloudDownloadOutline size={24} className="mr-2" />
                    {isDownloading ? "保存中..." : "オフライン保存"}
                  </button>
                )}
              </div>
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
  }
);

// 表示名を設定
SongOptionsPopover.displayName = "SongOptionsPopover";

export default SongOptionsPopover;
