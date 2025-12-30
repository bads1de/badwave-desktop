import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Playlist, Song } from "@/types";
import { ListPlus, ListMusic, Check } from "lucide-react";
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
        {children || <ListPlus size={20} />}
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
                <ListMusic size={16} className="mr-2" />
                <span>{playlist.title}</span>
              </div>
              {isInPlaylist[playlist.id] && (
                <Check size={16} className="ml-2 text-theme-500" />
              )}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AddPlaylist;
