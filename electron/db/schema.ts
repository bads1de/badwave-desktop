import {
  sqliteTable,
  text,
  real,
  integer,
  primaryKey,
} from "drizzle-orm/sqlite-core";

// 1. Songs: 楽曲のマスターデータ
// ダウンロード済みの楽曲と、ライブラリ上のメタデータのみの楽曲の両方を含みます。
export const songs = sqliteTable("songs", {
  id: text("id").primaryKey(), // SupabaseのUUIDと一致
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  author: text("author").notNull(),

  // ローカルファイルパス (AppDataに保存されたファイル)
  // nullの場合、メタデータのみが存在し、ファイルは未ダウンロードであることを意味します。
  songPath: text("song_path"),
  imagePath: text("image_path"),
  videoPath: text("video_path"),

  // 元のリモートURL (再ダウンロードやオンライン時のストリーミング用)
  originalSongPath: text("original_song_path"),
  originalImagePath: text("original_image_path"),
  originalVideoPath: text("original_video_path"),

  duration: real("duration"),
  genre: text("genre"),
  lyrics: text("lyrics"),

  // 管理用フィールド
  createdAt: text("created_at"), // SupabaseからのISO文字列
  downloadedAt: integer("downloaded_at", { mode: "timestamp" }), // ローカル保存日時
  lastPlayedAt: integer("last_played_at", { mode: "timestamp" }), // 「最近再生した曲」用
});

// 2. Playlists: ユーザー作成のプレイリスト
export const playlists = sqliteTable("playlists", {
  id: text("id").primaryKey(), // SupabaseのUUID
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  imagePath: text("image_path"), // ローカルパスまたはリモートURL（通常は未ダウンロードならリモート）
  isPublic: integer("is_public", { mode: "boolean" }).default(false),
  createdAt: text("created_at"),
});

// 3. Playlist Songs: プレイリストと曲の中間テーブル
export const playlistSongs = sqliteTable("playlist_songs", {
  id: text("id").primaryKey(),
  playlistId: text("playlist_id")
    .notNull()
    .references(() => playlists.id, { onDelete: "cascade" }),
  songId: text("song_id")
    .notNull()
    .references(() => songs.id, { onDelete: "cascade" }),
  addedAt: text("added_at"),
});

// 4. Liked Songs: ユーザーの「いいね」
export const likedSongs = sqliteTable(
  "liked_songs",
  {
    userId: text("user_id").notNull(),
    songId: text("song_id")
      .notNull()
      .references(() => songs.id, { onDelete: "cascade" }),
    likedAt: text("liked_at").default("now"),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.songId] }),
  })
);
