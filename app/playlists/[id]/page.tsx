import PlaylistPageContent from "./components/PlaylistPageContent";

const PlaylistPage = async (props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) => {
  const params = await props.params;
  const { id: playlistId } = params;

  // SSRでのデータフェッチを廃止し、クライアントサイドで取得
  return <PlaylistPageContent playlistId={playlistId} />;
};

export default PlaylistPage;
