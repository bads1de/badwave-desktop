"use client";

import { useSearchParams } from "next/navigation";
import useOnPlay from "@/hooks/player/useOnPlay";
import { useUser } from "@/hooks/auth/useUser";
import { Playlist, Song } from "@/types";
import usePlayer from "@/hooks/player/usePlayer";
import SongOptionsPopover from "@/components/Song/SongOptionsPopover";
import SongList from "@/components/Song/SongList";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useCallback, memo } from "react";

// 曲リストコンポーネントのプロップス型定義
interface SongListSectionProps {
  songs: Song[];
  playlistId?: string;
  onPlay: (id: string) => void;
}

// プレイリストリストコンポーネントのプロップス型定義
interface PlaylistSectionProps {
  playlists: Playlist[];
}

// 曲リストセクションコンポーネント（メモ化）
const SongListSection = memo(
  ({ songs, playlistId, onPlay }: SongListSectionProps) => {
    const { user } = useUser();

    if (songs.length === 0) {
      return (
        <div className="flex flex-col gap-y-2 w-full text-neutral-400 p-6">
          <h1>該当の曲が見つかりませんでした</h1>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-y-2 w-full p-6">
        {songs.map((song) => (
          <div key={song.id} className="flex items-center gap-x-4 w-full">
            <div className="flex-1 min-w-0">
              <SongList data={song} onClick={(id: string) => onPlay(id)} />
            </div>
            {user?.id && (
              <SongOptionsPopover song={song} playlistId={playlistId} />
            )}
          </div>
        ))}
      </div>
    );
  }
);

// プレイリストセクションコンポーネント（メモ化）
const PlaylistSection = memo(({ playlists }: PlaylistSectionProps) => {
  const router = useRouter();

  if (playlists.length === 0) {
    return (
      <div className="flex flex-col gap-y-2 w-full px-6 text-neutral-400">
        <h1>Playlistが見つかりませんでした</h1>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 p-6">
      {playlists.map((playlist, i) => (
        <motion.div
          key={playlist.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: i * 0.1 }}
          className="group relative cursor-pointer"
          onClick={() =>
            router.push(
              `/playlists/${playlist.id}?title=${encodeURIComponent(
                playlist.title
              )}`
            )
          }
        >
          <div className="absolute -top-2 -left-2 w-full h-full bg-purple-900/50 transform rotate-3 rounded-xl" />
          <div className="absolute -top-1 -left-1 w-full h-full bg-purple-800/50 transform rotate-2 rounded-xl" />
          <div className="relative bg-neutral-900 rounded-xl p-4 transform transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-xl group-hover:shadow-purple-900/20">
            <div className="relative aspect-square w-full overflow-hidden rounded-lg mb-4">
              <Image
                src={playlist.image_path || "/images/playlist.png"}
                alt={playlist.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width:1280px) 25vw, 20vw"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white truncate">
                {playlist.title}
              </h3>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
});

// コンポーネントにdisplayNameを設定
SongListSection.displayName = "SongListSection";
PlaylistSection.displayName = "PlaylistSection";

interface SearchContentProps {
  songs: Song[];
  playlists: Playlist[];
  playlistId?: string;
}

const SearchContent: React.FC<SearchContentProps> = ({
  songs,
  playlists,
  playlistId,
}) => {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "songs";
  const onPlay = useOnPlay(songs);
  const player = usePlayer();

  // 再生処理関数
  const handlePlay = useCallback(
    (id: string) => {
      onPlay(id);
      player.setId(id);
    },
    [onPlay, player]
  );

  return (
    <div className="w-full">
      {activeTab === "songs" && (
        <SongListSection
          songs={songs}
          playlistId={playlistId}
          onPlay={handlePlay}
        />
      )}
      {activeTab === "playlists" && <PlaylistSection playlists={playlists} />}
    </div>
  );
};

export default SearchContent;
