"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
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
var client_1 = require("../db/client");
var schema_1 = require("../db/schema");
var drizzle_orm_1 = require("drizzle-orm");
/**
 * IDを文字列に強制変換し、".0" などの浮動小数点表記を除去する
 */
var normalizeId = function (id) {
    if (id === null || id === undefined)
        return "";
    var s = String(id);
    return s.includes(".") ? s.split(".")[0] : s;
};
function setupCacheHandlers() {
    var _this = this;
    var db = (0, client_1.getDb)();
    /**
     * 楽曲メタデータを内部でupsertする
     */
    function internalSyncSongs(songsData) {
        return __awaiter(this, void 0, void 0, function () {
            var count, _i, songsData_1, song, songId, existing, record;
            var _a, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        count = 0;
                        _i = 0, songsData_1 = songsData;
                        _d.label = 1;
                    case 1:
                        if (!(_i < songsData_1.length)) return [3 /*break*/, 5];
                        song = songsData_1[_i];
                        songId = normalizeId(song.id);
                        return [4 /*yield*/, db.query.songs.findFirst({
                                where: (0, drizzle_orm_1.eq)(schema_1.songs.id, songId),
                                columns: { songPath: true, imagePath: true, downloadedAt: true },
                            })];
                    case 2:
                        existing = _d.sent();
                        record = {
                            id: songId,
                            userId: String(song.user_id || ""),
                            title: String(song.title || "Unknown Title"),
                            author: String(song.author || "Unknown Author"),
                            songPath: (_a = existing === null || existing === void 0 ? void 0 : existing.songPath) !== null && _a !== void 0 ? _a : null,
                            imagePath: (_b = existing === null || existing === void 0 ? void 0 : existing.imagePath) !== null && _b !== void 0 ? _b : null,
                            originalSongPath: song.song_path,
                            originalImagePath: song.image_path,
                            duration: song.duration ? Number(song.duration) : null,
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
                    case 3:
                        _d.sent();
                        count++;
                        _d.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 1];
                    case 5: return [2 /*return*/, count];
                }
            });
        });
    }
    // --- Handlers ---
    electron_1.ipcMain.handle("sync-songs-metadata", function (_, data) { return __awaiter(_this, void 0, void 0, function () {
        var count, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, internalSyncSongs(data)];
                case 1:
                    count = _a.sent();
                    return [2 /*return*/, { success: true, count: count }];
                case 2:
                    error_1 = _a.sent();
                    return [2 /*return*/, { success: false, error: error_1.message }];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    electron_1.ipcMain.handle("sync-playlists", function (_, data) { return __awaiter(_this, void 0, void 0, function () {
        var _i, data_1, item, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    _i = 0, data_1 = data;
                    _a.label = 1;
                case 1:
                    if (!(_i < data_1.length)) return [3 /*break*/, 4];
                    item = data_1[_i];
                    return [4 /*yield*/, db
                            .insert(schema_1.playlists)
                            .values({
                            id: normalizeId(item.id),
                            userId: String(item.user_id),
                            title: String(item.title),
                            imagePath: item.image_path,
                            isPublic: Boolean(item.is_public),
                            createdAt: item.createdAt || item.created_at,
                        })
                            .onConflictDoUpdate({
                            target: schema_1.playlists.id,
                            set: {
                                title: String(item.title),
                                imagePath: item.image_path,
                                isPublic: Boolean(item.is_public),
                            },
                        })];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/, { success: true, count: data.length }];
                case 5:
                    error_2 = _a.sent();
                    return [2 /*return*/, { success: false, error: error_2.message }];
                case 6: return [2 /*return*/];
            }
        });
    }); });
    electron_1.ipcMain.handle("sync-playlist-songs", function (_1, _a) { return __awaiter(_this, [_1, _a], void 0, function (_, _b) {
        var _i, fullSongsData_1, songData, songId, psId, error_3;
        var playlistId = _b.playlistId, fullSongsData = _b.songs;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 6, , 7]);
                    return [4 /*yield*/, internalSyncSongs(fullSongsData)];
                case 1:
                    _c.sent();
                    _i = 0, fullSongsData_1 = fullSongsData;
                    _c.label = 2;
                case 2:
                    if (!(_i < fullSongsData_1.length)) return [3 /*break*/, 5];
                    songData = fullSongsData_1[_i];
                    songId = normalizeId(songData.id);
                    psId = "".concat(playlistId, "_").concat(songId);
                    return [4 /*yield*/, db
                            .insert(schema_1.playlistSongs)
                            .values({
                            id: psId,
                            playlistId: normalizeId(playlistId),
                            songId: songId,
                            addedAt: songData.created_at,
                        })
                            .onConflictDoNothing()];
                case 3:
                    _c.sent();
                    _c.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5: return [2 /*return*/, { success: true }];
                case 6:
                    error_3 = _c.sent();
                    return [2 /*return*/, { success: false, error: error_3.message }];
                case 7: return [2 /*return*/];
            }
        });
    }); });
    electron_1.ipcMain.handle("sync-liked-songs", function (_1, _a) { return __awaiter(_this, [_1, _a], void 0, function (_, _b) {
        var _i, fullSongsData_2, songData, error_4;
        var userId = _b.userId, fullSongsData = _b.songs;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 6, , 7]);
                    return [4 /*yield*/, internalSyncSongs(fullSongsData)];
                case 1:
                    _c.sent();
                    _i = 0, fullSongsData_2 = fullSongsData;
                    _c.label = 2;
                case 2:
                    if (!(_i < fullSongsData_2.length)) return [3 /*break*/, 5];
                    songData = fullSongsData_2[_i];
                    return [4 /*yield*/, db
                            .insert(schema_1.likedSongs)
                            .values({
                            userId: String(userId),
                            songId: normalizeId(songData.id),
                            likedAt: songData.created_at || new Date().toISOString(),
                        })
                            .onConflictDoNothing()];
                case 3:
                    _c.sent();
                    _c.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5: return [2 /*return*/, { success: true }];
                case 6:
                    error_4 = _c.sent();
                    console.error("[Sync] Liked Songs Error:", error_4);
                    return [2 /*return*/, { success: false, error: error_4.message }];
                case 7: return [2 /*return*/];
            }
        });
    }); });
    electron_1.ipcMain.handle("get-cached-liked-songs", function (_, userId) { return __awaiter(_this, void 0, void 0, function () {
        var results, error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, db
                            .select()
                            .from(schema_1.likedSongs)
                            .leftJoin(schema_1.songs, (0, drizzle_orm_1.sql)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["CAST(", " AS TEXT) = CAST(", " AS TEXT)"], ["CAST(", " AS TEXT) = CAST(", " AS TEXT)"])), schema_1.likedSongs.songId, schema_1.songs.id))
                            .where((0, drizzle_orm_1.eq)(schema_1.likedSongs.userId, String(userId)))];
                case 1:
                    results = _a.sent();
                    return [2 /*return*/, results.map(function (row) {
                            var liked_songs = row.liked_songs;
                            var song = row.songs;
                            return {
                                id: (song === null || song === void 0 ? void 0 : song.id) || liked_songs.songId,
                                user_id: liked_songs.userId,
                                title: (song === null || song === void 0 ? void 0 : song.title) || "Unknown Title",
                                author: (song === null || song === void 0 ? void 0 : song.author) || "Unknown Author",
                                song_path: (song === null || song === void 0 ? void 0 : song.originalSongPath) || null,
                                image_path: (song === null || song === void 0 ? void 0 : song.originalImagePath) || null,
                                is_downloaded: !!(song === null || song === void 0 ? void 0 : song.songPath),
                                local_song_path: (song === null || song === void 0 ? void 0 : song.songPath) || null,
                                local_image_path: (song === null || song === void 0 ? void 0 : song.imagePath) || null,
                                created_at: liked_songs.likedAt,
                            };
                        })];
                case 2:
                    error_5 = _a.sent();
                    console.error("[IPC] get-cached-liked-songs error:", error_5);
                    return [2 /*return*/, []];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    electron_1.ipcMain.handle("get-cached-playlists", function (_, userId) { return __awaiter(_this, void 0, void 0, function () {
        var data, error_6;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, db.query.playlists.findMany({
                            where: (0, drizzle_orm_1.eq)(schema_1.playlists.userId, String(userId)),
                        })];
                case 1:
                    data = _a.sent();
                    return [2 /*return*/, data.map(function (item) { return ({
                            id: item.id,
                            user_id: item.userId,
                            title: item.title,
                            image_path: item.imagePath,
                            is_public: item.isPublic,
                            created_at: item.createdAt,
                        }); })];
                case 2:
                    error_6 = _a.sent();
                    return [2 /*return*/, []];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    electron_1.ipcMain.handle("get-cached-playlist-songs", function (_, playlistId) { return __awaiter(_this, void 0, void 0, function () {
        var results, error_7;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, db
                            .select()
                            .from(schema_1.playlistSongs)
                            .leftJoin(schema_1.songs, (0, drizzle_orm_1.sql)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["CAST(", " AS TEXT) = CAST(", " AS TEXT)"], ["CAST(", " AS TEXT) = CAST(", " AS TEXT)"])), schema_1.playlistSongs.songId, schema_1.songs.id))
                            .where((0, drizzle_orm_1.eq)(schema_1.playlistSongs.playlistId, normalizeId(playlistId)))];
                case 1:
                    results = _a.sent();
                    return [2 /*return*/, results.map(function (row) {
                            var playlist_songs = row.playlist_songs;
                            var song = row.songs;
                            return {
                                id: (song === null || song === void 0 ? void 0 : song.id) || playlist_songs.songId,
                                user_id: (song === null || song === void 0 ? void 0 : song.userId) || "",
                                title: (song === null || song === void 0 ? void 0 : song.title) || "Unknown Title",
                                author: (song === null || song === void 0 ? void 0 : song.author) || "Unknown Author",
                                song_path: (song === null || song === void 0 ? void 0 : song.originalSongPath) || null,
                                image_path: (song === null || song === void 0 ? void 0 : song.originalImagePath) || null,
                                is_downloaded: !!(song === null || song === void 0 ? void 0 : song.songPath),
                                local_song_path: (song === null || song === void 0 ? void 0 : song.songPath) || null,
                                local_image_path: (song === null || song === void 0 ? void 0 : song.imagePath) || null,
                                created_at: playlist_songs.addedAt,
                            };
                        })];
                case 2:
                    error_7 = _a.sent();
                    return [2 /*return*/, []];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    electron_1.ipcMain.handle("debug-dump-db", function () { return __awaiter(_this, void 0, void 0, function () {
        var liked, allSongs, joined, error_8;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    return [4 /*yield*/, db.select().from(schema_1.likedSongs).limit(10)];
                case 1:
                    liked = _a.sent();
                    return [4 /*yield*/, db.select().from(schema_1.songs).limit(10)];
                case 2:
                    allSongs = _a.sent();
                    return [4 /*yield*/, db
                            .select()
                            .from(schema_1.likedSongs)
                            .leftJoin(schema_1.songs, (0, drizzle_orm_1.sql)(templateObject_3 || (templateObject_3 = __makeTemplateObject(["CAST(", " AS TEXT) = CAST(", " AS TEXT)"], ["CAST(", " AS TEXT) = CAST(", " AS TEXT)"])), schema_1.likedSongs.songId, schema_1.songs.id))
                            .limit(10)];
                case 3:
                    joined = _a.sent();
                    return [2 /*return*/, { liked: liked, allSongs: allSongs, joined: joined }];
                case 4:
                    error_8 = _a.sent();
                    return [2 /*return*/, { error: error_8.message }];
                case 5: return [2 /*return*/];
            }
        });
    }); });
}
var templateObject_1, templateObject_2, templateObject_3;
//# sourceMappingURL=cache.js.map