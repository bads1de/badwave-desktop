"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.likedSongs = exports.playlistSongs = exports.playlists = exports.songs = void 0;
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
//# sourceMappingURL=schema.js.map