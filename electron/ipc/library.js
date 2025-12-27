"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupLibraryHandlers = setupLibraryHandlers;
var electron_1 = require("electron");
var fs = __importStar(require("fs"));
var path = __importStar(require("path"));
var mm = __importStar(require("music-metadata"));
var store_1 = __importDefault(require("../lib/store"));
var utils_1 = require("../utils");
// 音楽ライブラリのデータを保存するためのストアキー
var MUSIC_LIBRARY_KEY = "music_library";
var MUSIC_LIBRARY_LAST_SCAN_KEY = "music_library_last_scan";
function setupLibraryHandlers() {
    var _this = this;
    // 指定されたフォルダ内のMP3ファイルをスキャン（永続化対応版）
    electron_1.ipcMain.handle("handle-scan-mp3-files", function (_1, directoryPath_1) {
        var args_1 = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args_1[_i - 2] = arguments[_i];
        }
        return __awaiter(_this, __spreadArray([_1, directoryPath_1], args_1, true), void 0, function (_, directoryPath, forceFullScan) {
            var savedLibrary, isSameDirectory, shouldPerformDiffScan, currentLibrary, scanDirectory_1, allFiles, newFiles, modifiedFiles, unchangedFiles, _a, allFiles_1, filePath, stats, lastModified, savedFile, deletedFiles, filePath, error_1;
            var _this = this;
            if (forceFullScan === void 0) { forceFullScan = false; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 6, , 7]);
                        savedLibrary = store_1.default.get(MUSIC_LIBRARY_KEY);
                        isSameDirectory = (savedLibrary === null || savedLibrary === void 0 ? void 0 : savedLibrary.directoryPath) === directoryPath;
                        shouldPerformDiffScan = isSameDirectory && !forceFullScan;
                        (0, utils_1.debugLog)("[Scan] \u30B9\u30AD\u30E3\u30F3\u958B\u59CB: ".concat(directoryPath, " (\u5DEE\u5206\u30B9\u30AD\u30E3\u30F3: ").concat(shouldPerformDiffScan, ")"));
                        currentLibrary = {
                            directoryPath: directoryPath,
                            files: {},
                        };
                        scanDirectory_1 = function (dir) { return __awaiter(_this, void 0, void 0, function () {
                            var entries, files, _i, entries_1, entry, fullPath, subFiles;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, fs.promises.readdir(dir, {
                                            withFileTypes: true,
                                        })];
                                    case 1:
                                        entries = _a.sent();
                                        files = [];
                                        _i = 0, entries_1 = entries;
                                        _a.label = 2;
                                    case 2:
                                        if (!(_i < entries_1.length)) return [3 /*break*/, 6];
                                        entry = entries_1[_i];
                                        fullPath = path.join(dir, entry.name);
                                        if (!entry.isDirectory()) return [3 /*break*/, 4];
                                        return [4 /*yield*/, scanDirectory_1(fullPath)];
                                    case 3:
                                        subFiles = _a.sent();
                                        files.push.apply(files, subFiles);
                                        return [3 /*break*/, 5];
                                    case 4:
                                        if (entry.isFile() &&
                                            path.extname(entry.name).toLowerCase() === ".mp3") {
                                            // MP3ファイルのみを追加
                                            files.push(fullPath);
                                        }
                                        _a.label = 5;
                                    case 5:
                                        _i++;
                                        return [3 /*break*/, 2];
                                    case 6: return [2 /*return*/, files];
                                }
                            });
                        }); };
                        return [4 /*yield*/, scanDirectory_1(directoryPath)];
                    case 1:
                        allFiles = _b.sent();
                        newFiles = [];
                        modifiedFiles = [];
                        unchangedFiles = [];
                        _a = 0, allFiles_1 = allFiles;
                        _b.label = 2;
                    case 2:
                        if (!(_a < allFiles_1.length)) return [3 /*break*/, 5];
                        filePath = allFiles_1[_a];
                        return [4 /*yield*/, fs.promises.stat(filePath)];
                    case 3:
                        stats = _b.sent();
                        lastModified = stats.mtimeMs;
                        if (shouldPerformDiffScan && savedLibrary.files[filePath]) {
                            savedFile = savedLibrary.files[filePath];
                            if (savedFile.lastModified === lastModified) {
                                // ファイルが変更されていない場合
                                unchangedFiles.push(filePath);
                                // 前回のメタデータを再利用
                                currentLibrary.files[filePath] = savedFile;
                            }
                            else {
                                // ファイルが変更されている場合
                                modifiedFiles.push(filePath);
                                // 新しいエントリを作成（メタデータは後で取得）
                                currentLibrary.files[filePath] = {
                                    lastModified: lastModified,
                                };
                            }
                        }
                        else {
                            // 新しいファイルの場合
                            newFiles.push(filePath);
                            // 新しいエントリを作成（メタデータは後で取得）
                            currentLibrary.files[filePath] = {
                                lastModified: lastModified,
                            };
                        }
                        _b.label = 4;
                    case 4:
                        _a++;
                        return [3 /*break*/, 2];
                    case 5:
                        deletedFiles = [];
                        if (shouldPerformDiffScan) {
                            for (filePath in savedLibrary.files) {
                                if (!allFiles.includes(filePath)) {
                                    deletedFiles.push(filePath);
                                }
                            }
                        }
                        // スキャン結果をストアに保存
                        store_1.default.set(MUSIC_LIBRARY_KEY, currentLibrary);
                        store_1.default.set(MUSIC_LIBRARY_LAST_SCAN_KEY, new Date().toISOString());
                        (0, utils_1.debugLog)("[Scan] \u30B9\u30AD\u30E3\u30F3\u5B8C\u4E86: \u65B0\u898F=".concat(newFiles.length, ", \u5909\u66F4=").concat(modifiedFiles.length, ", \u5909\u66F4\u306A\u3057=").concat(unchangedFiles.length, ", \u524A\u9664=").concat(deletedFiles.length));
                        // スキャン結果を返す
                        return [2 /*return*/, {
                                files: allFiles,
                                scanInfo: {
                                    newFiles: newFiles,
                                    modifiedFiles: modifiedFiles,
                                    unchangedFiles: unchangedFiles,
                                    deletedFiles: deletedFiles,
                                    isSameDirectory: isSameDirectory,
                                    isFullScan: !shouldPerformDiffScan,
                                },
                            }];
                    case 6:
                        error_1 = _b.sent();
                        (0, utils_1.debugLog)("[Error] MP3\u30D5\u30A1\u30A4\u30EB\u306E\u30B9\u30AD\u30E3\u30F3\u306B\u5931\u6557: ".concat(directoryPath), error_1);
                        return [2 /*return*/, { error: error_1.message }];
                    case 7: return [2 /*return*/];
                }
            });
        });
    });
    // 保存されている音楽ライブラリデータを取得
    electron_1.ipcMain.handle("handle-get-saved-music-library", function () { return __awaiter(_this, void 0, void 0, function () {
        var savedLibrary, lastScan, directoryExists, e_1, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    savedLibrary = store_1.default.get(MUSIC_LIBRARY_KEY);
                    lastScan = store_1.default.get(MUSIC_LIBRARY_LAST_SCAN_KEY);
                    if (!savedLibrary) {
                        return [2 /*return*/, { exists: false }];
                    }
                    directoryExists = false;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, fs.promises.access(savedLibrary.directoryPath)];
                case 2:
                    _a.sent();
                    directoryExists = true;
                    return [3 /*break*/, 4];
                case 3:
                    e_1 = _a.sent();
                    // ディレクトリが存在しない場合
                    directoryExists = false;
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/, {
                        exists: true,
                        directoryPath: savedLibrary.directoryPath,
                        fileCount: Object.keys(savedLibrary.files).length,
                        lastScan: lastScan,
                        directoryExists: directoryExists,
                    }];
                case 5:
                    error_2 = _a.sent();
                    (0, utils_1.debugLog)("[Error] \u4FDD\u5B58\u3055\u308C\u305F\u97F3\u697D\u30E9\u30A4\u30D6\u30E9\u30EA\u306E\u53D6\u5F97\u306B\u5931\u6557:", error_2);
                    return [2 /*return*/, { error: error_2.message }];
                case 6: return [2 /*return*/];
            }
        });
    }); });
    // MP3ファイルのメタデータを取得
    electron_1.ipcMain.handle("handle-get-mp3-metadata", function (_, filePath) { return __awaiter(_this, void 0, void 0, function () {
        var savedLibrary, stats, lastModified, metadata, error_3, savedLibrary;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    savedLibrary = store_1.default.get(MUSIC_LIBRARY_KEY);
                    return [4 /*yield*/, fs.promises.stat(filePath)];
                case 1:
                    stats = _a.sent();
                    lastModified = stats.mtimeMs;
                    // 保存されているメタデータがあり、ファイルが変更されていない場合は保存されているメタデータを返す
                    if (savedLibrary &&
                        savedLibrary.files[filePath] &&
                        savedLibrary.files[filePath].metadata &&
                        savedLibrary.files[filePath].lastModified === lastModified) {
                        return [2 /*return*/, {
                                metadata: savedLibrary.files[filePath].metadata,
                                fromCache: true,
                            }];
                    }
                    return [4 /*yield*/, mm.parseFile(filePath)];
                case 2:
                    metadata = _a.sent();
                    // ライブラリデータを更新
                    if (savedLibrary) {
                        if (!savedLibrary.files[filePath]) {
                            savedLibrary.files[filePath] = { lastModified: lastModified };
                        }
                        savedLibrary.files[filePath].metadata = metadata;
                        savedLibrary.files[filePath].lastModified = lastModified;
                        delete savedLibrary.files[filePath].error;
                        // 更新したライブラリデータを保存
                        store_1.default.set(MUSIC_LIBRARY_KEY, savedLibrary);
                    }
                    return [2 /*return*/, { metadata: metadata, fromCache: false }];
                case 3:
                    error_3 = _a.sent();
                    (0, utils_1.debugLog)("[Error] \u30E1\u30BF\u30C7\u30FC\u30BF\u306E\u53D6\u5F97\u306B\u5931\u6557: ".concat(filePath), error_3);
                    savedLibrary = store_1.default.get(MUSIC_LIBRARY_KEY);
                    if (savedLibrary && savedLibrary.files[filePath]) {
                        savedLibrary.files[filePath].error = error_3.message;
                        store_1.default.set(MUSIC_LIBRARY_KEY, savedLibrary);
                    }
                    return [2 /*return*/, { error: error_3.message }];
                case 4: return [2 /*return*/];
            }
        });
    }); });
}
//# sourceMappingURL=library.js.map