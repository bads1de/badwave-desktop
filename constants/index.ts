export const videoIds = [
  { id: 1, name: "synthwave radio", videoId: "4xDzrJKXOOY" },
  { id: 2, name: "lofi hip hop radio", videoId: "jfKfPfyJRdk" },
  { id: 3, name: "dark ambient radio", videoId: "S_MOd40zlYU" },
  { id: 4, name: "Blade Runner Radio", videoId: "RrkrdYm3HPQ" },
  { id: 5, name: "tokyo night drive", videoId: "Lcdi9O2XB4E" },
];

export const genres = [
  { id: "j-pop", name: "J-Pop" },
  { id: "synth wave", name: "Synth Wave" },
  { id: "nu disco", name: "Nu Disco" },
  { id: "city pop", name: "City Pop" },
  { id: "tropical house", name: "Tropical House" },
  { id: "vapor wave", name: "Vapor Wave" },
  { id: "future funk", name: "Future Funk" },
  { id: "pop", name: "Pop" },
  { id: "electronic", name: "Electronic" },
  { id: "dance pop", name: "Dance Pop" },
  { id: "electro house", name: "Electro House" },
  { id: "hip-hop", name: "Hip-Hop" },
  { id: "dnb", name: "DnB" },
  { id: "r&b", name: "R&B" },
  { id: "other", name: "Other" },
];

export const CACHE_PREFIX = "@query-cache";

export const CACHED_QUERIES = {
  media: "media",
  songUrl: "songUrl",
  songById: "songById",
  songsByGenres: "songsByGenres",
  trendSongs: "trendSongs",
  downloadFile: "downloadFile",
  getTopSongs: "getTopSongs",
  playlists: "playlists",
  likeStatus: "likeStatus",
  likedSongs: "likedSongs",
  userDetails: "userDetails",
  spotlight: "spotlight",
} as const;

/**
 * Electronストアのキー
 */
export const ELECTRON_STORE_KEYS = {
  VOLUME: "player_volume",
} as const;

export const CACHE_CONFIG = {
  staleTime: 1000 * 60 * 10, // 10分間
  gcTime: 1000 * 60 * 30, // 30分間
} as const;

/**
 * 認証が必要なルートのリスト
 */
export const PROTECTED_ROUTES = ["/account", "/liked"] as const;
