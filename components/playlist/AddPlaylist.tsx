import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Playlist, Song } from "@/types";
import { RiPlayListAddFill, RiPlayListFill } from "react-icons/ri";
import toast from "react-hot-toast";
import { ERROR_MESSAGES } from "@/constants/errorMessages";
import { useUser } from "@/hooks/auth/useUser";
import useAuthModal from "@/hooks/auth/useAuthModal";
import useGetSongById from "@/hooks/data/useGetSongById";
import usePlaylistSongStatus from "@/hooks/data/usePlaylistSongStatus";
import useMutatePlaylistSong from "@/hooks/mutations/useMutatePlaylistSong";

interface PlaylistMenuProps {
  playlists: Playlist[];
  songId: string;
  songType: "regular";
  children?: React.ReactNode;
  disabled?: boolean;
  /** 曲データ（渡されれば useGetSongById をスキップ） */
  song?: Song;
}

/**
 * プレイリストに曲を追加するドロップダウンメニューコンポーネント
 *
 * @param playlists プレイリストの配列
 * @param songId 曲のID
 * @param songType 曲のタイプ ("regular")
 * @param children ドロップダウンのトリガーとなる要素
 * @param song 曲データ（オプション - 渡されれば useGetSongById をスキップ）
 */
const AddPlaylist: React.FC<PlaylistMenuProps> = ({
  playlists,
  songId,
  songType = "regular",
  children,
  disabled = false,
  song: propSong,
}) => {
  const { user } = useUser();
  const authModal = useAuthModal();

  // propSong が渡されれば useGetSongById をスキップ
  const { song: fetchedSong } = useGetSongById(propSong ? undefined : songId);
  const song = propSong || fetchedSong;

  // プレイリストに曲が含まれているかどうかを取得
  const { isInPlaylist } = usePlaylistSongStatus(songId, playlists);

  // プレイリスト曲の追加ミューテーションを取得
  const { addPlaylistSong } = useMutatePlaylistSong();

  /**
   * プレイリストに曲を追加するハンドラー
   *
   * @param playlistId 追加先のプレイリストID
   */
  const handleAddToPlaylist = (playlistId: string) => {
    if (!user) {
      authModal.onOpen();
      return;
    }

    if (isInPlaylist[playlistId]) {
      toast.error(ERROR_MESSAGES.PLAYLIST_ALREADY_ADDED);
      return;
    }

    // 曲の画像パスがある場合、プレイリスト画像も更新する
    const updateImagePath =
      songType === "regular" && song?.image_path ? song.image_path : undefined;

    addPlaylistSong.mutate({
      songId,
      playlistId,
      songType,
      updateImagePath,
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        className={`text-theme-500 outline-none group transition-all duration-300 drop-shadow-[0_0_5px_rgba(var(--theme-500),0.5)] cyber-glitch ${
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:text-white"
        }`}
      >
        <div className="p-2 border border-theme-500/20 group-hover:border-theme-500/60 bg-theme-500/5 group-hover:bg-theme-500/20 transition-all rounded-none">
          {children || <RiPlayListAddFill size={20} />}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="center" className="font-mono bg-[#0a0a0f]/95 backdrop-blur-xl border-theme-500/40 p-2 min-w-[200px]">
        <div className="px-3 py-2 text-[8px] text-theme-500/40 border-b border-theme-500/10 mb-1 tracking-widest uppercase">
           // SELECT_TARGET_COLLECTION
        </div>
        {playlists.length === 0 ? (
          <DropdownMenuItem className="text-theme-900 text-[10px] tracking-widest">[ ! ] NO_PLAYLISTS_FOUND</DropdownMenuItem>
        ) : (
          playlists.map((playlist) => (
            <DropdownMenuItem
              key={playlist.id}
              onClick={() => handleAddToPlaylist(playlist.id)}
              className="flex items-center justify-between group/item p-2 hover:bg-theme-500/10 focus:bg-theme-500/20 transition-all cursor-pointer"
            >
              <div className="flex items-center">
                <RiPlayListFill size={14} className="mr-3 text-theme-500/60 group-hover/item:text-theme-500" />
                <span className="text-xs tracking-wider uppercase">{playlist.title}</span>
              </div>
              {isInPlaylist[playlist.id] && (
                <span className="ml-2 text-[8px] text-theme-500 font-black animate-pulse">SCAN_OK</span>
              )}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AddPlaylist;
