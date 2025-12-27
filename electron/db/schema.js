"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.likedSongs = exports.playlistSongs = exports.playlists = exports.songs = void 0;
var sqlite_core_1 = require("drizzle-orm/sqlite-core");
// 1. Songs: Master data for songs.
// Contains both downloaded tracks and metadata-only cache from library.
exports.songs = (0, sqlite_core_1.sqliteTable)("songs", {
    id: (0, sqlite_core_1.text)("id").primaryKey(), // Matches Supabase UUID
    userId: (0, sqlite_core_1.text)("user_id").notNull(),
    title: (0, sqlite_core_1.text)("title").notNull(),
    author: (0, sqlite_core_1.text)("author").notNull(),
    // Local file paths (files saved in AppData)
    // If null, it means we only have metadata (not downloaded)
    songPath: (0, sqlite_core_1.text)("song_path"),
    imagePath: (0, sqlite_core_1.text)("image_path"),
    // Original remote URLs (for re-downloading or streaming if online)
    originalSongPath: (0, sqlite_core_1.text)("original_song_path"),
    originalImagePath: (0, sqlite_core_1.text)("original_image_path"),
    duration: (0, sqlite_core_1.real)("duration"),
    genre: (0, sqlite_core_1.text)("genre"),
    lyrics: (0, sqlite_core_1.text)("lyrics"),
    // Audit fields
    createdAt: (0, sqlite_core_1.text)("created_at"), // ISO string from Supabase
    downloadedAt: (0, sqlite_core_1.integer)("downloaded_at", { mode: "timestamp" }), // When it was saved locally
    lastPlayedAt: (0, sqlite_core_1.integer)("last_played_at", { mode: "timestamp" }), // For "Recently Played"
});
// 2. Playlists: User created playlists
exports.playlists = (0, sqlite_core_1.sqliteTable)("playlists", {
    id: (0, sqlite_core_1.text)("id").primaryKey(), // Supabase UUID
    userId: (0, sqlite_core_1.text)("user_id").notNull(),
    title: (0, sqlite_core_1.text)("title").notNull(),
    imagePath: (0, sqlite_core_1.text)("image_path"), // Local path or remote URL? Usually remote unless downloaded.
    isPublic: (0, sqlite_core_1.integer)("is_public", { mode: "boolean" }).default(false),
    createdAt: (0, sqlite_core_1.text)("created_at"),
});
// 3. Playlist Songs: Junction table
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
// 4. Liked Songs: User favorites
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