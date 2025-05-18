import getPlaylistSongs from "@/actions/getPlaylistSongs";
import PlaylistPageContent from "./components/PlaylistPageContent";
import getPlaylist from "@/actions/getPlaylist";
import { Song } from "@/types";
import { notFound } from "next/navigation";

type CombinedSong = Song & { songType: "regular" };

const PlaylistPage = async (props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) => {
  const params = await props.params;
  const { id: playlistId } = params;

  const playlist = await getPlaylist(playlistId);
  const songs = await getPlaylistSongs(playlistId);

  if (!playlist) {
    return notFound();
  }

  return (
    <PlaylistPageContent playlist={playlist} songs={songs as CombinedSong[]} />
  );
};

export default PlaylistPage;
