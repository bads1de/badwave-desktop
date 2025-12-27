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
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSimpleDownloadHandlers = setupSimpleDownloadHandlers;
var electron_1 = require("electron");
var fs = __importStar(require("fs"));
var path = __importStar(require("path"));
var https = __importStar(require("https"));
var utils_1 = require("../utils");
function setupSimpleDownloadHandlers() {
    var _this = this;
    // 曲のダウンロード
    // 注意: offline.tsのsetupDownloadHandlersとチャンネル名が重複する可能性があります
    // どちらか一方のみを使用してください
    electron_1.ipcMain.handle("download-song-simple", // チャンネル名を変更して競合を回避
    function (event, url, filename) { return __awaiter(_this, void 0, void 0, function () {
        var userDataPath, downloadsDir, filePath_1, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    userDataPath = electron_1.app.getPath("userData");
                    downloadsDir = path.join(userDataPath, "downloads");
                    if (!!fs.existsSync(downloadsDir)) return [3 /*break*/, 2];
                    return [4 /*yield*/, fs.promises.mkdir(downloadsDir, { recursive: true })];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2:
                    filePath_1 = path.join(downloadsDir, filename);
                    (0, utils_1.debugLog)("[Download] Starting download: ".concat(url, " -> ").concat(filePath_1));
                    return [2 /*return*/, new Promise(function (resolve, reject) {
                            var file = fs.createWriteStream(filePath_1);
                            https
                                .get(url, function (response) {
                                if (response.statusCode !== 200) {
                                    fs.unlink(filePath_1, function () { }); // ゴミ掃除
                                    reject(new Error("Status Code: ".concat(response.statusCode)));
                                    return;
                                }
                                var totalSize = parseInt(response.headers["content-length"] || "0", 10);
                                var downloadedSize = 0;
                                response.on("data", function (chunk) {
                                    downloadedSize += chunk.length;
                                    if (totalSize > 0) {
                                        var progress = Math.round((downloadedSize / totalSize) * 100);
                                        // 進捗を送信
                                        event.sender.send("download-progress", progress);
                                    }
                                });
                                response.pipe(file);
                                file.on("finish", function () {
                                    file.close(function () {
                                        (0, utils_1.debugLog)("[Download] Completed: ".concat(filePath_1));
                                        resolve(filePath_1);
                                    });
                                });
                            })
                                .on("error", function (err) {
                                fs.unlink(filePath_1, function () { });
                                reject(err);
                            });
                        })];
                case 3:
                    error_1 = _a.sent();
                    (0, utils_1.debugLog)("[Download] Error:", error_1);
                    throw error_1;
                case 4: return [2 /*return*/];
            }
        });
    }); });
    // ファイル存在確認
    electron_1.ipcMain.handle("check-file-exists", function (_, filename) { return __awaiter(_this, void 0, void 0, function () {
        var userDataPath, filePath, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    userDataPath = electron_1.app.getPath("userData");
                    filePath = path.join(userDataPath, "downloads", filename);
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, fs.promises.access(filePath)];
                case 2:
                    _b.sent();
                    return [2 /*return*/, true];
                case 3:
                    _a = _b.sent();
                    return [2 /*return*/, false];
                case 4: return [2 /*return*/];
            }
        });
    }); });
    // ローカルファイルのパスを取得
    electron_1.ipcMain.handle("get-local-file-path", function (_, filename) {
        var userDataPath = electron_1.app.getPath("userData");
        // appプロトコルで読めるように絶対パスを返す
        return path.join(userDataPath, "downloads", filename);
    });
    // ファイル削除
    electron_1.ipcMain.handle("delete-song", function (_, filename) { return __awaiter(_this, void 0, void 0, function () {
        var userDataPath, filePath, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    userDataPath = electron_1.app.getPath("userData");
                    filePath = path.join(userDataPath, "downloads", filename);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, fs.promises.unlink(filePath)];
                case 2:
                    _a.sent();
                    return [2 /*return*/, true];
                case 3:
                    error_2 = _a.sent();
                    (0, utils_1.debugLog)("[Delete] Error:", error_2);
                    return [2 /*return*/, false];
                case 4: return [2 /*return*/];
            }
        });
    }); });
}
//# sourceMappingURL=simple_download.js.map