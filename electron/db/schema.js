"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sectionCache = exports.spotlights = exports.likedSongs = exports.playlistSongs = exports.playlists = exports.songs = void 0;
var sqlite_core_1 = require("drizzle-orm/sqlite-core");
// 1. Songs: 楽曲のマスターデータ
// ダウンロード済みの楽曲と、ライブラリ上のメタデータのみの楽曲の両方を含みます。
exports.songs = (0, sqlite_core_1.sqliteTable)("songs", {
    id: (0, sqlite_core_1.text)("id").primaryKey(), // SupabaseのUUIDと一致
    userId: (0, sqlite_core_1.text)("user_id").notNull(),
    title: (0, sqlite_core_1.text)("title").notNull(),
    author: (0, sqlite_core_1.text)("author").notNull(),
    // ローカルファイルパス (AppDataに保存されたファイル)
    // nullの場合、メタデータのみが存在し、ファイルは未ダウンロードであることを意味します。
    songPath: (0, sqlite_core_1.text)("song_path"),
    imagePath: (0, sqlite_core_1.text)("image_path"),
    videoPath: (0, sqlite_core_1.text)("video_path"),
    // 元のリモートURL (再ダウンロードやオンライン時のストリーミング用)
    originalSongPath: (0, sqlite_core_1.text)("original_song_path"),
    originalImagePath: (0, sqlite_core_1.text)("original_image_path"),
    originalVideoPath: (0, sqlite_core_1.text)("original_video_path"),
    duration: (0, sqlite_core_1.real)("duration"),
    genre: (0, sqlite_core_1.text)("genre"),
    lyrics: (0, sqlite_core_1.text)("lyrics"),
    // 管理用フィールド
    createdAt: (0, sqlite_core_1.text)("created_at"), // SupabaseからのISO文字列
    downloadedAt: (0, sqlite_core_1.integer)("downloaded_at", { mode: "timestamp" }), // ローカル保存日時
    lastPlayedAt: (0, sqlite_core_1.integer)("last_played_at", { mode: "timestamp" }), // 「最近再生した曲」用
    playCount: (0, sqlite_core_1.integer)("play_count").default(0),
    likeCount: (0, sqlite_core_1.integer)("like_count").default(0),
});
// 2. Playlists: ユーザー作成のプレイリスト
exports.playlists = (0, sqlite_core_1.sqliteTable)("playlists", {
    id: (0, sqlite_core_1.text)("id").primaryKey(), // SupabaseのUUID
    userId: (0, sqlite_core_1.text)("user_id").notNull(),
    title: (0, sqlite_core_1.text)("title").notNull(),
    imagePath: (0, sqlite_core_1.text)("image_path"), // ローカルパスまたはリモートURL（通常は未ダウンロードならリモート）
    isPublic: (0, sqlite_core_1.integer)("is_public", { mode: "boolean" }).default(false),
    createdAt: (0, sqlite_core_1.text)("created_at"),
});
// 3. Playlist Songs: プレイリストと曲の中間テーブル
exports.playlistSongs = (0, sqlite_core_1.sqliteTable)("playlist_songs", {
    id: (0, sqlite_core_1.text)("id").primaryKey(),
    playlistId: (0, sqlite_core_1.text)("playlist_id")
        .notNull()
        .references(function () { return exports.playlists.id; }, { onDelete: "cascade" }),
    songId: (0, sqlite_core_1.text)("song_id")
        .notNull()
        .references(function () { return exports.songs.id; }, { onDelete: "cascade" }),
    addedAt: (0, sqlite_core_1.text)("added_at"),
});
// 4. Liked Songs: ユーザーの「いいね」
exports.likedSongs = (0, sqlite_core_1.sqliteTable)("liked_songs", {
    userId: (0, sqlite_core_1.text)("user_id").notNull(),
    songId: (0, sqlite_core_1.text)("song_id")
        .notNull()
        .references(function () { return exports.songs.id; }, { onDelete: "cascade" }),
    likedAt: (0, sqlite_core_1.text)("liked_at").default("now"),
}, function (table) { return ({
    pk: (0, sqlite_core_1.primaryKey)({ columns: [table.userId, table.songId] }),
}); });
// 5. Spotlights: スポットライト（動画）データ
exports.spotlights = (0, sqlite_core_1.sqliteTable)("spotlights", {
    id: (0, sqlite_core_1.text)("id").primaryKey(),
    title: (0, sqlite_core_1.text)("title").notNull(),
    author: (0, sqlite_core_1.text)("author").notNull(),
    description: (0, sqlite_core_1.text)("description"),
    genre: (0, sqlite_core_1.text)("genre"),
    // リモートURL
    originalVideoPath: (0, sqlite_core_1.text)("original_video_path"),
    originalThumbnailPath: (0, sqlite_core_1.text)("original_thumbnail_path"),
    // ローカルパス（ダウンロード機能用）
    videoPath: (0, sqlite_core_1.text)("video_path"),
    thumbnailPath: (0, sqlite_core_1.text)("thumbnail_path"),
    createdAt: (0, sqlite_core_1.text)("created_at"),
    downloadedAt: (0, sqlite_core_1.integer)("downloaded_at", { mode: "timestamp" }),
});
// 6. Section Cache: ホーム画面等のセクションデータ（順序付きリスト）
// 例: トレンド、スポットライト、For Youなど
exports.sectionCache = (0, sqlite_core_1.sqliteTable)("section_cache", {
    key: (0, sqlite_core_1.text)("key").primaryKey(), // 例: "home_trends_all", "home_spotlight"
    itemIds: (0, sqlite_core_1.text)("item_ids", { mode: "json" }), // IDの順序付き配列 string[]
    updatedAt: (0, sqlite_core_1.integer)("updated_at", { mode: "timestamp" }).default(new Date()),
});
//# sourceMappingURL=schema.js.map