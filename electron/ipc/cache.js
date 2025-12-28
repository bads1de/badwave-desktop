"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupCacheHandlers = setupCacheHandlers;
var electron_1 = require("electron");
var utils_1 = require("../utils");
var client_1 = require("../db/client");
var schema_1 = require("../db/schema");
var drizzle_orm_1 = require("drizzle-orm");
function setupCacheHandlers() {
    var _this = this;
    var db = (0, client_1.getDb)();
    /**
     * 曲のメタデータをローカルDBにキャッシュ
     * ダウンロード状態（songPath）は上書きしない
     */
    electron_1.ipcMain.handle("sync-songs-metadata", function (_, songsData) { return __awaiter(_this, void 0, void 0, function () {
        var count, _i, songsData_1, song, existing, record, error_1;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    (0, utils_1.debugLog)("[IPC] sync-songs-metadata: ".concat(songsData.length, " \u4EF6\u306E\u66F2\u3092\u30AD\u30E3\u30C3\u30B7\u30E5"));
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 7, , 8]);
                    count = 0;
                    _i = 0, songsData_1 = songsData;
                    _d.label = 2;
                case 2:
                    if (!(_i < songsData_1.length)) return [3 /*break*/, 6];
                    song = songsData_1[_i];
                    return [4 /*yield*/, db.query.songs.findFirst({
                            where: (0, drizzle_orm_1.eq)(schema_1.songs.id, song.id),
                            columns: { songPath: true, imagePath: true, downloadedAt: true },
                        })];
                case 3:
                    existing = _d.sent();
                    record = {
                        id: song.id,
                        userId: song.user_id,
                        title: song.title,
                        author: song.author,
                        // ダウンロード状態は既存の値を維持、なければnull
                        songPath: (_a = existing === null || existing === void 0 ? void 0 : existing.songPath) !== null && _a !== void 0 ? _a : null,
                        imagePath: (_b = existing === null || existing === void 0 ? void 0 : existing.imagePath) !== null && _b !== void 0 ? _b : null,
                        // リモートURLを保存
                        originalSongPath: song.song_path,
                        originalImagePath: song.image_path,
                        duration: song.duration,
                        genre: song.genre,
                        lyrics: song.lyrics,
                        createdAt: song.created_at,
                        downloadedAt: (_c = existing === null || existing === void 0 ? void 0 : existing.downloadedAt) !== null && _c !== void 0 ? _c : null,
                    };
                    return [4 /*yield*/, db
                            .insert(schema_1.songs)
                            .values(record)
                            .onConflictDoUpdate({
                            target: schema_1.songs.id,
                            set: {
                                // ダウンロード関連以外を更新
                                title: record.title,
                                author: record.author,
                                originalSongPath: record.originalSongPath,
                                originalImagePath: record.originalImagePath,
                                duration: record.duration,
                                genre: record.genre,
                                lyrics: record.lyrics,
                                createdAt: record.createdAt,
                            },
                        })];
                case 4:
                    _d.sent();
                    count++;
                    _d.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 2];
                case 6:
                    (0, utils_1.debugLog)("[IPC] sync-songs-metadata: ".concat(count, " \u4EF6\u3092\u30AD\u30E3\u30C3\u30B7\u30E5\u3057\u307E\u3057\u305F"));
                    return [2 /*return*/, { success: true, count: count }];
                case 7:
                    error_1 = _d.sent();
                    console.error("[IPC] Failed to sync songs metadata:", error_1);
                    return [2 /*return*/, { success: false, error: error_1.message }];
                case 8: return [2 /*return*/];
            }
        });
    }); });
    /**
     * プレイリストをローカルDBにキャッシュ
     */
    electron_1.ipcMain.handle("sync-playlists", function (_, playlistsData) { return __awaiter(_this, void 0, void 0, function () {
        var count, _i, playlistsData_1, playlist, record, error_2;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    (0, utils_1.debugLog)("[IPC] sync-playlists: ".concat(playlistsData.length, " \u4EF6\u306E\u30D7\u30EC\u30A4\u30EA\u30B9\u30C8\u3092\u30AD\u30E3\u30C3\u30B7\u30E5"));
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 6, , 7]);
                    count = 0;
                    _i = 0, playlistsData_1 = playlistsData;
                    _b.label = 2;
                case 2:
                    if (!(_i < playlistsData_1.length)) return [3 /*break*/, 5];
                    playlist = playlistsData_1[_i];
                    record = {
                        id: playlist.id,
                        userId: playlist.user_id,
                        title: playlist.title,
                        imagePath: (_a = playlist.image_path) !== null && _a !== void 0 ? _a : null,
                        isPublic: playlist.is_public,
                        createdAt: playlist.created_at,
                    };
                    return [4 /*yield*/, db.insert(schema_1.playlists).values(record).onConflictDoUpdate({
                            target: schema_1.playlists.id,
                            set: record,
                        })];
                case 3:
                    _b.sent();
                    count++;
                    _b.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5:
                    (0, utils_1.debugLog)("[IPC] sync-playlists: ".concat(count, " \u4EF6\u3092\u30AD\u30E3\u30C3\u30B7\u30E5\u3057\u307E\u3057\u305F"));
                    return [2 /*return*/, { success: true, count: count }];
                case 6:
                    error_2 = _b.sent();
                    console.error("[IPC] Failed to sync playlists:", error_2);
                    return [2 /*return*/, { success: false, error: error_2.message }];
                case 7: return [2 /*return*/];
            }
        });
    }); });
    /**
     * プレイリスト内の曲をローカルDBにキャッシュ
     */
    electron_1.ipcMain.handle("sync-playlist-songs", function (_, playlistSongsData) { return __awaiter(_this, void 0, void 0, function () {
        var count, _i, playlistSongsData_1, ps, record, error_3;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    (0, utils_1.debugLog)("[IPC] sync-playlist-songs: ".concat(playlistSongsData.length, " \u4EF6\u3092\u30AD\u30E3\u30C3\u30B7\u30E5"));
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 6, , 7]);
                    count = 0;
                    _i = 0, playlistSongsData_1 = playlistSongsData;
                    _b.label = 2;
                case 2:
                    if (!(_i < playlistSongsData_1.length)) return [3 /*break*/, 5];
                    ps = playlistSongsData_1[_i];
                    record = {
                        id: ps.id,
                        playlistId: ps.playlist_id,
                        songId: ps.song_id,
                        addedAt: (_a = ps.created_at) !== null && _a !== void 0 ? _a : null,
                    };
                    return [4 /*yield*/, db.insert(schema_1.playlistSongs).values(record).onConflictDoNothing()];
                case 3:
                    _b.sent();
                    count++;
                    _b.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5:
                    (0, utils_1.debugLog)("[IPC] sync-playlist-songs: ".concat(count, " \u4EF6\u3092\u30AD\u30E3\u30C3\u30B7\u30E5\u3057\u307E\u3057\u305F"));
                    return [2 /*return*/, { success: true, count: count }];
                case 6:
                    error_3 = _b.sent();
                    console.error("[IPC] Failed to sync playlist songs:", error_3);
                    return [2 /*return*/, { success: false, error: error_3.message }];
                case 7: return [2 /*return*/];
            }
        });
    }); });
    /**
     * いいねした曲をローカルDBにキャッシュ
     */
    electron_1.ipcMain.handle("sync-liked-songs", function (_, likedSongsData) { return __awaiter(_this, void 0, void 0, function () {
        var count, _i, likedSongsData_1, liked, record, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    (0, utils_1.debugLog)("[IPC] sync-liked-songs: ".concat(likedSongsData.length, " \u4EF6\u306E\u3044\u3044\u306D\u3092\u30AD\u30E3\u30C3\u30B7\u30E5"));
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, , 7]);
                    count = 0;
                    _i = 0, likedSongsData_1 = likedSongsData;
                    _a.label = 2;
                case 2:
                    if (!(_i < likedSongsData_1.length)) return [3 /*break*/, 5];
                    liked = likedSongsData_1[_i];
                    record = {
                        userId: liked.user_id,
                        songId: liked.song_id,
                        likedAt: liked.created_at,
                    };
                    return [4 /*yield*/, db.insert(schema_1.likedSongs).values(record).onConflictDoNothing()];
                case 3:
                    _a.sent();
                    count++;
                    _a.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5:
                    (0, utils_1.debugLog)("[IPC] sync-liked-songs: ".concat(count, " \u4EF6\u3092\u30AD\u30E3\u30C3\u30B7\u30E5\u3057\u307E\u3057\u305F"));
                    return [2 /*return*/, { success: true, count: count }];
                case 6:
                    error_4 = _a.sent();
                    console.error("[IPC] Failed to sync liked songs:", error_4);
                    return [2 /*return*/, { success: false, error: error_4.message }];
                case 7: return [2 /*return*/];
            }
        });
    }); });
    /**
     * キャッシュされたプレイリストを取得
     */
    electron_1.ipcMain.handle("get-cached-playlists", function (_, userId) { return __awaiter(_this, void 0, void 0, function () {
        var cachedPlaylists, error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    (0, utils_1.debugLog)("[IPC] get-cached-playlists for user: ".concat(userId));
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, db.query.playlists.findMany({
                            where: (0, drizzle_orm_1.eq)(schema_1.playlists.userId, userId),
                        })];
                case 2:
                    cachedPlaylists = _a.sent();
                    // Supabase形式に変換して返す
                    return [2 /*return*/, cachedPlaylists.map(function (p) { return ({
                            id: p.id,
                            user_id: p.userId,
                            title: p.title,
                            image_path: p.imagePath,
                            is_public: p.isPublic,
                            created_at: p.createdAt,
                        }); })];
                case 3:
                    error_5 = _a.sent();
                    console.error("[IPC] Failed to get cached playlists:", error_5);
                    return [2 /*return*/, []];
                case 4: return [2 /*return*/];
            }
        });
    }); });
    /**
     * キャッシュされたいいね曲を取得（ダウンロード状態付き）
     */
    electron_1.ipcMain.handle("get-cached-liked-songs", function (_, userId) { return __awaiter(_this, void 0, void 0, function () {
        var likes, songIds, songsData, error_6;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    (0, utils_1.debugLog)("[IPC] get-cached-liked-songs for user: ".concat(userId));
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, db.query.likedSongs.findMany({
                            where: (0, drizzle_orm_1.eq)(schema_1.likedSongs.userId, userId),
                        })];
                case 2:
                    likes = _a.sent();
                    if (likes.length === 0) {
                        return [2 /*return*/, []];
                    }
                    songIds = likes.map(function (l) { return l.songId; });
                    return [4 /*yield*/, db.query.songs.findMany({
                            where: (0, drizzle_orm_1.inArray)(schema_1.songs.id, songIds),
                        })];
                case 3:
                    songsData = _a.sent();
                    // 曲データにダウンロード状態を追加して返す
                    return [2 /*return*/, songsData.map(function (song) { return ({
                            id: song.id,
                            user_id: song.userId,
                            title: song.title,
                            author: song.author,
                            song_path: song.originalSongPath, // オフライン表示用にはリモートURL
                            image_path: song.originalImagePath,
                            duration: song.duration,
                            genre: song.genre,
                            lyrics: song.lyrics,
                            created_at: song.createdAt,
                            // ダウンロード状態を追加
                            is_downloaded: song.songPath !== null,
                            local_song_path: song.songPath, // ダウンロード済みならローカルパス
                            local_image_path: song.imagePath,
                        }); })];
                case 4:
                    error_6 = _a.sent();
                    console.error("[IPC] Failed to get cached liked songs:", error_6);
                    return [2 /*return*/, []];
                case 5: return [2 /*return*/];
            }
        });
    }); });
    /**
     * キャッシュされたプレイリスト内の曲を取得（ダウンロード状態付き）
     */
    electron_1.ipcMain.handle("get-cached-playlist-songs", function (_, playlistId) { return __awaiter(_this, void 0, void 0, function () {
        var psSongs, songIds, songsData, error_7;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    (0, utils_1.debugLog)("[IPC] get-cached-playlist-songs for playlist: ".concat(playlistId));
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, db.query.playlistSongs.findMany({
                            where: (0, drizzle_orm_1.eq)(schema_1.playlistSongs.playlistId, playlistId),
                        })];
                case 2:
                    psSongs = _a.sent();
                    if (psSongs.length === 0) {
                        return [2 /*return*/, []];
                    }
                    songIds = psSongs.map(function (ps) { return ps.songId; });
                    return [4 /*yield*/, db.query.songs.findMany({
                            where: (0, drizzle_orm_1.inArray)(schema_1.songs.id, songIds),
                        })];
                case 3:
                    songsData = _a.sent();
                    // 曲データにダウンロード状態を追加して返す
                    return [2 /*return*/, songsData.map(function (song) { return ({
                            id: song.id,
                            user_id: song.userId,
                            title: song.title,
                            author: song.author,
                            song_path: song.originalSongPath,
                            image_path: song.originalImagePath,
                            duration: song.duration,
                            genre: song.genre,
                            lyrics: song.lyrics,
                            created_at: song.createdAt,
                            is_downloaded: song.songPath !== null,
                            local_song_path: song.songPath,
                            local_image_path: song.imagePath,
                        }); })];
                case 4:
                    error_7 = _a.sent();
                    console.error("[IPC] Failed to get cached playlist songs:", error_7);
                    return [2 /*return*/, []];
                case 5: return [2 /*return*/];
            }
        });
    }); });
}
//# sourceMappingURL=cache.js.map