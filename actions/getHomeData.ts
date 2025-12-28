import { createClient } from "@/libs/supabase/server";
import { Playlist, Song, Spotlight } from "@/types";

export interface HomeInitialData {
  trendSongs: Song[];
  spotlightData: Spotlight[];
  latestSongs: Song[];
  publicPlaylists: Playlist[];
}

/**
 * ホーム画面の初期データを取得する関数 (Server Side)
 *
 * ビルド時またはISG/SSR時に実行され、クライアントに渡す初期データを一括取得します。
 */
export const getHomeData = async (): Promise<HomeInitialData> => {
  const supabase = await createClient();

  const fetchTrends = supabase
    .from("songs")
    .select("*")
    .order("count", { ascending: false })
    .limit(10);

  const fetchSpotlight = supabase
    .from("spotlights")
    .select("*")
    .order("created_at", { ascending: false });

  const fetchLatest = supabase
    .from("songs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(12);

  const fetchPlaylists = supabase
    .from("playlists")
    .select("*")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(6);

  const [trendsRes, spotlightRes, latestRes, playlistsRes] = await Promise.all([
    fetchTrends,
    fetchSpotlight,
    fetchLatest,
    fetchPlaylists,
  ]);

  if (trendsRes.error) console.error("Error fetching trends:", trendsRes.error);
  if (spotlightRes.error)
    console.error("Error fetching spotlight:", spotlightRes.error);
  if (latestRes.error) console.error("Error fetching latest:", latestRes.error);
  if (playlistsRes.error)
    console.error("Error fetching playlists:", playlistsRes.error);

  return {
    trendSongs: (trendsRes.data as Song[]) || [],
    spotlightData: (spotlightRes.data as Spotlight[]) || [],
    latestSongs: (latestRes.data as Song[]) || [],
    publicPlaylists: (playlistsRes.data as Playlist[]) || [],
  };
};
