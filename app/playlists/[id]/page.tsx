import PlaylistPageContent from "./components/PlaylistPageContent";

const PlaylistPage = async (props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) => {
  const params = await props.params;
  const { id: playlistId } = params;

  return <PlaylistPageContent playlistId={playlistId} />;
};

export default PlaylistPage;
