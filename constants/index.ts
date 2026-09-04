/**
 * サポートされている音声ファイルの拡張子
 * 注: 配列として定義し、Set への変換は各利用側で行う（es5 target 対応）
 */
export const SUPPORTED_AUDIO_EXTENSIONS = [
  ".mp3", ".wav", ".flac", ".aac", ".ogg", ".opus",
  ".m4a", ".wma", ".alac", ".aiff", ".webm",
];

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
  pulse: "pulse",
  localFiles: "localFiles",
  savedLibraryInfo: "savedLibraryInfo",
  songs: "songs",
  recommendations: "recommendations",
  publicPlaylists: "publicPlaylists",
  userStats: "userStats",
  playlistSongStatus: "playlistSongStatus",
} as const;

/**
 * Electronストアのキー
 */
export const ELECTRON_STORE_KEYS = {
  VOLUME: "player_volume",
  RIGHT_SIDEBAR_WIDTH: "right_sidebar_width",
  RIGHT_SIDEBAR_CLOSED: "right_sidebar_closed",
  MUSIC_LIBRARY: "music_library",
  MUSIC_LIBRARY_LAST_SCAN: "music_library_last_scan",
} as const;

/**
 * TanStack Query のキャッシュ設定
 *
 * networkMode: "offlineFirst" は TanStackProvider で設定されています。
 * これにより、オフライン時はまずキャッシュから表示し、
 * ネットワークリクエストが失敗した場合は retry を pause します。
 */
export const CACHE_CONFIG = {
  staleTime: 1000 * 60 * 10, // 10分間
  gcTime: 1000 * 60 * 30, // 30分間
} as const;

/**
 * 認証が必要なルートのリスト
 */
export const PROTECTED_ROUTES = ["/account", "/liked"] as const;

export const TABLES = {
  SONGS: "songs",
  PLAYLISTS: "playlists",
  PLAYLIST_SONGS: "playlist_songs",
  LIKED_SONGS_REGULAR: "liked_songs_regular",
  USERS: "users",
  SPOTLIGHTS: "spotlights",
  PULSES: "pulses",
  PLAY_HISTORY: "play_history",
} as const;

export const DURATIONS = {
  FAST: 0.3,
  NORMAL: 0.5,
  SLOW: 1,
  LOADING_PULSE: 1.5,
  ROTATE_SLOW: 2,
  ROTATE_FAST: 3,
  BACKGROUND: 5,
} as const;

export const SPRING_SIDEBAR = { stiffness: 300, damping: 30 } as const;

export const ROUTES = {
  HOME: "/",
  ACCOUNT: "/account",
  LIKED: "/liked",
  SEARCH: "/search",
  LOCAL: "/local",
  OFFLINE: "/offline",
  PULSE: "/pulse",
  SONGS_ALL: "/songs/all",
  SONGS_DETAIL: (id: string) => `/songs/${id}`,
  GENRE: (genre: string) => `/genre/${encodeURIComponent(genre)}`,
  PLAYLISTS: "/playlists",
  PLAYLISTS_DETAIL: (id: string) => `/playlists/${id}`,
} as const;
