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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupDownloadHandlers = void 0;
var electron_1 = require("electron");
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var https_1 = __importDefault(require("https"));
var http_1 = __importDefault(require("http"));
var utils_1 = require("../utils");
var client_1 = require("../db/client");
var schema_1 = require("../db/schema");
var drizzle_orm_1 = require("drizzle-orm");
var setupDownloadHandlers = function () {
    var db = (0, client_1.getDb)();
    // 楽曲のダウンロードリクエストを処理
    electron_1.ipcMain.handle("download-song", function (event, song) { return __awaiter(void 0, void 0, void 0, function () {
        var songId, userDataPath, offlineDir, songsDir, imagesDir, getExtension, songExt, imageExt, localSongFilename, localImageFilename, localSongPath, localImagePath_1, downloadFile_1, downloadTasks, finalLocalImagePath_1, songRecord, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    songId = song.id;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, , 7]);
                    userDataPath = electron_1.app.getPath("userData");
                    offlineDir = path_1.default.join(userDataPath, "offline_storage");
                    songsDir = path_1.default.join(offlineDir, "songs");
                    imagesDir = path_1.default.join(offlineDir, "images");
                    // ディレクトリが存在することを確認
                    return [4 /*yield*/, fs_1.default.promises.mkdir(songsDir, { recursive: true })];
                case 2:
                    // ディレクトリが存在することを確認
                    _a.sent();
                    return [4 /*yield*/, fs_1.default.promises.mkdir(imagesDir, { recursive: true })];
                case 3:
                    _a.sent();
                    getExtension = function (url, fallback) {
                        try {
                            var urlObj = new URL(url);
                            var ext = path_1.default.extname(urlObj.pathname);
                            return ext || fallback;
                        }
                        catch (e) {
                            var match = url.match(/\.([a-z0-9]+)(?:[\?#]|$)/i);
                            return match ? ".".concat(match[1]) : fallback;
                        }
                    };
                    songExt = getExtension(song.song_path, ".mp3");
                    imageExt = song.image_path
                        ? getExtension(song.image_path, ".jpg")
                        : ".jpg";
                    localSongFilename = "".concat(songId).concat(songExt);
                    localImageFilename = "".concat(songId).concat(imageExt);
                    localSongPath = path_1.default.join(songsDir, localSongFilename);
                    localImagePath_1 = path_1.default.join(imagesDir, localImageFilename);
                    downloadFile_1 = function (url, dest) {
                        return new Promise(function (resolve, reject) {
                            var client = url.startsWith("https") ? https_1.default : http_1.default;
                            var file = fs_1.default.createWriteStream(dest);
                            var request = client.get(url, function (response) {
                                // リダイレクトの処理 (301, 302)
                                if (response.statusCode === 301 || response.statusCode === 302) {
                                    var redirectUrl = response.headers.location;
                                    if (redirectUrl) {
                                        file.close();
                                        downloadFile_1(redirectUrl, dest).then(resolve).catch(reject);
                                        return;
                                    }
                                }
                                if (response.statusCode !== 200) {
                                    fs_1.default.unlink(dest, function () { });
                                    reject(new Error("Download failed with status code: ".concat(response.statusCode, " for ").concat(url)));
                                    return;
                                }
                                response.pipe(file);
                                file.on("finish", function () {
                                    file.close(function () { return resolve(); });
                                });
                            });
                            request.on("error", function (err) {
                                fs_1.default.unlink(dest, function () { });
                                reject(err);
                            });
                            // タイムアウト設定 (30秒)
                            request.setTimeout(30000, function () {
                                request.destroy();
                                reject(new Error("Download timeout for ".concat(url)));
                            });
                        });
                    };
                    downloadTasks = [];
                    if (song.song_path) {
                        downloadTasks.push(downloadFile_1(song.song_path, localSongPath));
                    }
                    finalLocalImagePath_1 = null;
                    if (song.image_path) {
                        downloadTasks.push(downloadFile_1(song.image_path, localImagePath_1).then(function () {
                            finalLocalImagePath_1 = "file://".concat(localImagePath_1);
                        }));
                    }
                    return [4 /*yield*/, Promise.all(downloadTasks)];
                case 4:
                    _a.sent();
                    songRecord = {
                        id: song.id,
                        userId: song.userId,
                        title: song.title,
                        author: song.author,
                        // ローカルパス (独自のプロトコル形式)
                        songPath: "file://".concat(localSongPath),
                        imagePath: finalLocalImagePath_1,
                        // 元のリモートURL (再ダウンロードなどの参照用)
                        originalSongPath: song.song_path,
                        originalImagePath: song.image_path,
                        duration: song.duration,
                        genre: song.genre,
                        lyrics: song.lyrics,
                        createdAt: song.created_at,
                        downloadedAt: new Date(),
                    };
                    return [4 /*yield*/, db.insert(schema_1.songs).values(songRecord).onConflictDoUpdate({
                            target: schema_1.songs.id,
                            set: songRecord,
                        })];
                case 5:
                    _a.sent();
                    return [2 /*return*/, { success: true, localPath: songRecord.songPath }];
                case 6:
                    error_1 = _a.sent();
                    return [2 /*return*/, { success: false, error: error_1.message }];
                case 7: return [2 /*return*/];
            }
        });
    }); });
    // オフラインステータスの確認
    electron_1.ipcMain.handle("check-offline-status", function (_, songId) { return __awaiter(void 0, void 0, void 0, function () {
        var result, isDownloaded, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, db.query.songs.findFirst({
                            where: (0, drizzle_orm_1.eq)(schema_1.songs.id, songId),
                            columns: {
                                songPath: true,
                                imagePath: true,
                            },
                        })];
                case 1:
                    result = _a.sent();
                    isDownloaded = !!(result && result.songPath);
                    return [2 /*return*/, {
                            isDownloaded: isDownloaded,
                            localPath: (result === null || result === void 0 ? void 0 : result.songPath) || undefined,
                            localImagePath: (result === null || result === void 0 ? void 0 : result.imagePath) || undefined,
                        }];
                case 2:
                    error_2 = _a.sent();
                    console.error("Failed to check offline status:", error_2);
                    return [2 /*return*/, { isDownloaded: false }];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    // すべてのオフライン楽曲（ダウンロード済み）を取得
    electron_1.ipcMain.handle("get-offline-songs", function () { return __awaiter(void 0, void 0, void 0, function () {
        var offlineSongs, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, db.query.songs.findMany({
                            where: (0, drizzle_orm_1.isNotNull)(schema_1.songs.songPath),
                        })];
                case 1:
                    offlineSongs = _a.sent();
                    // レンダラープロセスが期待する Song 型に変換して返す
                    return [2 /*return*/, offlineSongs.map(function (song) { return ({
                            id: song.id,
                            user_id: song.userId,
                            title: song.title,
                            author: song.author,
                            song_path: song.songPath,
                            image_path: song.imagePath,
                            original_song_path: song.originalSongPath,
                            original_image_path: song.originalImagePath,
                            duration: song.duration,
                            genre: song.genre,
                            lyrics: song.lyrics,
                            created_at: song.createdAt,
                            downloaded_at: song.downloadedAt,
                        }); })];
                case 2:
                    error_3 = _a.sent();
                    console.error("[IPC] Failed to get offline songs:", error_3);
                    return [2 /*return*/, []];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    // オフライン楽曲の削除 (ファイルとDBレコードの両方を削除)
    electron_1.ipcMain.handle("delete-offline-song", function (_, songId) { return __awaiter(void 0, void 0, void 0, function () {
        var songRecord, filesToDelete, _i, filesToDelete_1, filePath, err_1, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 10, , 11]);
                    return [4 /*yield*/, db.query.songs.findFirst({
                            where: (0, drizzle_orm_1.eq)(schema_1.songs.id, songId),
                        })];
                case 1:
                    songRecord = _a.sent();
                    if (!songRecord) {
                        return [2 /*return*/, { success: false, error: "Song not found" }];
                    }
                    filesToDelete = [];
                    if (songRecord.songPath) {
                        filesToDelete.push((0, utils_1.toLocalPath)(songRecord.songPath));
                    }
                    if (songRecord.imagePath) {
                        filesToDelete.push((0, utils_1.toLocalPath)(songRecord.imagePath));
                    }
                    _i = 0, filesToDelete_1 = filesToDelete;
                    _a.label = 2;
                case 2:
                    if (!(_i < filesToDelete_1.length)) return [3 /*break*/, 8];
                    filePath = filesToDelete_1[_i];
                    _a.label = 3;
                case 3:
                    _a.trys.push([3, 6, , 7]);
                    if (!fs_1.default.existsSync(filePath)) return [3 /*break*/, 5];
                    return [4 /*yield*/, fs_1.default.promises.unlink(filePath)];
                case 4:
                    _a.sent();
                    _a.label = 5;
                case 5: return [3 /*break*/, 7];
                case 6:
                    err_1 = _a.sent();
                    if (err_1.code !== "ENOENT") {
                        // ignore
                    }
                    return [3 /*break*/, 7];
                case 7:
                    _i++;
                    return [3 /*break*/, 2];
                case 8: 
                // 3. データベースからレコードを削除
                return [4 /*yield*/, db.delete(schema_1.songs).where((0, drizzle_orm_1.eq)(schema_1.songs.id, songId))];
                case 9:
                    // 3. データベースからレコードを削除
                    _a.sent();
                    return [2 /*return*/, { success: true }];
                case 10:
                    error_4 = _a.sent();
                    console.error("[IPC] Failed to delete offline song ".concat(songId, ":"), error_4);
                    return [2 /*return*/, { success: false, error: error_4.message }];
                case 11: return [2 /*return*/];
            }
        });
    }); });
};
exports.setupDownloadHandlers = setupDownloadHandlers;
//# sourceMappingURL=offline.js.map