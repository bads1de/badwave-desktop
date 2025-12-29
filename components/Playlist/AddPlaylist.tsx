import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Playlist } from "@/types";
import { RiPlayListAddFill, RiPlayListFill } from "react-icons/ri";
import toast from "react-hot-toast";
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
}

/**
 * プレイリストに曲を追加するドロップダウンメニューコンポーネント
 *
 * @param playlists プレイリストの配列
 * @param songId 曲のID
 * @param songType 曲のタイプ ("regular")
 * @param children ドロップダウンのトリガーとなる要素
 */
const AddPlaylist: React.FC<PlaylistMenuProps> = ({
  playlists,
  songId,
  songType = "regular",
  children,
  disabled = false,
}) => {
  const { user } = useUser();
  const authModal = useAuthModal();
  const { song } = useGetSongById(songId);

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
      toast.error("既にプレイリストに追加されています。");
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
        className={`text-neutral-400 transition-all duration-300 ${
          disabled
            ? "cursor-not-allowed opacity-50"
            : "cursor-pointer hover:text-white hover:filter hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]"
        }`}
      >
        {children || <RiPlayListAddFill size={20} />}
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {playlists.length === 0 ? (
          <DropdownMenuItem>プレイリストを作成しましょう！</DropdownMenuItem>
        ) : (
          playlists.map((playlist) => (
            <DropdownMenuItem
              key={playlist.id}
              onClick={() => handleAddToPlaylist(playlist.id)}
              className="flex items-center justify-between"
            >
              <div className="flex items-center">
                <RiPlayListFill size={15} className="mr-1" />
                <span>{playlist.title}</span>
              </div>
              {isInPlaylist[playlist.id] && <span className="ml-2">✓</span>}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AddPlaylist;
