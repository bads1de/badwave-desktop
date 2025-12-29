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
exports.getMainWindow = getMainWindow;
exports.createMainWindow = createMainWindow;
var electron_1 = require("electron");
var path = __importStar(require("path"));
var utils_1 = require("../utils");
var server_1 = require("./server");
// グローバル参照を保持（ガベージコレクションを防ぐため）
var mainWindow = null;
// メインウィンドウの取得
function getMainWindow() {
    return mainWindow;
}
// メインウィンドウの作成
function createMainWindow() {
    return __awaiter(this, void 0, void 0, function () {
        var isMac, err_1, port, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    isMac = process.platform === "darwin";
                    mainWindow = new electron_1.BrowserWindow({
                        width: 1600,
                        height: 900,
                        minWidth: 800,
                        minHeight: 600,
                        webPreferences: {
                            nodeIntegration: false,
                            contextIsolation: true,
                            preload: path.join(__dirname, "../preload/index.js"),
                            webSecurity: false, // ローカルファイルの読み込みを許可
                            backgroundThrottling: false, // バックグラウンドでのスロットリングを無効化（オーディオ再生を維持）
                        },
                        // macOSでは背景色を設定しないとタイトルバーが白くなる
                        backgroundColor: "#121212",
                        // タイトルバーをカスタマイズ
                        titleBarStyle: isMac ? "hiddenInset" : "default",
                        // Windowsではフレームレスにする
                        frame: isMac ? true : false,
                        // アプリケーションアイコンを設定
                        icon: path.join(__dirname, "../../public/logo.png"),
                    });
                    // 外部リンクをデフォルトブラウザで開く
                    mainWindow.webContents.setWindowOpenHandler(function (_a) {
                        var url = _a.url;
                        electron_1.shell.openExternal(url);
                        return { action: "deny" };
                    });
                    if (!utils_1.isDev) return [3 /*break*/, 6];
                    (0, utils_1.debugLog)("isDev = ".concat(utils_1.isDev, ", process.env.NODE_ENV = ").concat(process.env.NODE_ENV, ", app.isPackaged = ").concat(electron_1.app.isPackaged));
                    (0, utils_1.debugLog)("開発モードで起動しています");
                    mainWindow.webContents.openDevTools();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 5]);
                    // 開発サーバーが起動しているか確認
                    (0, utils_1.debugLog)("ローカル開発サーバー(http://localhost:3000)に接続を試みます...");
                    return [4 /*yield*/, mainWindow.loadURL("http://localhost:3000")];
                case 2:
                    _a.sent();
                    (0, utils_1.debugLog)("開発サーバーに接続しました");
                    return [3 /*break*/, 5];
                case 3:
                    err_1 = _a.sent();
                    console.error("開発サーバーへの接続に失敗しました:", err_1);
                    // 開発モードでは開発サーバーが必須
                    return [4 /*yield*/, mainWindow.loadURL("data:text/html;charset=utf-8," +
                            encodeURIComponent("<html>\n              <head><style>body{background:#121212;color:#fff;font-family:sans-serif;padding:40px;}</style></head>\n              <body>\n                <h1>\u958B\u767A\u30B5\u30FC\u30D0\u30FC\u306B\u63A5\u7D9A\u3067\u304D\u307E\u305B\u3093</h1>\n                <p>\u5225\u306E\u30BF\u30FC\u30DF\u30CA\u30EB\u3067 <code>npm run dev</code> \u3092\u5B9F\u884C\u3057\u3066\u304B\u3089\u3001\u30A2\u30D7\u30EA\u3092\u518D\u8D77\u52D5\u3057\u3066\u304F\u3060\u3055\u3044\u3002</p>\n              </body>\n            </html>"))];
                case 4:
                    // 開発モードでは開発サーバーが必須
                    _a.sent();
                    return [3 /*break*/, 5];
                case 5: return [3 /*break*/, 12];
                case 6:
                    (0, utils_1.debugLog)("本番モードで起動しています - Standaloneサーバーを起動します");
                    mainWindow.webContents.closeDevTools();
                    _a.label = 7;
                case 7:
                    _a.trys.push([7, 10, , 12]);
                    return [4 /*yield*/, (0, server_1.startNextServer)()];
                case 8:
                    port = _a.sent();
                    (0, utils_1.debugLog)("Standalone\u30B5\u30FC\u30D0\u30FC\u304C\u30DD\u30FC\u30C8 ".concat(port, " \u3067\u8D77\u52D5\u3057\u307E\u3057\u305F"));
                    // ローカルサーバーに接続
                    return [4 /*yield*/, mainWindow.loadURL("http://localhost:".concat(port))];
                case 9:
                    // ローカルサーバーに接続
                    _a.sent();
                    (0, utils_1.debugLog)("Standaloneサーバーに接続しました");
                    return [3 /*break*/, 12];
                case 10:
                    err_2 = _a.sent();
                    console.error("Standaloneサーバーの起動に失敗しました:", err_2);
                    return [4 /*yield*/, mainWindow.loadURL("data:text/html;charset=utf-8," +
                            encodeURIComponent("<html>\n              <head><style>body{background:#121212;color:#fff;font-family:sans-serif;padding:40px;}</style></head>\n              <body>\n                <h1>\u30A2\u30D7\u30EA\u30B1\u30FC\u30B7\u30E7\u30F3\u306E\u8D77\u52D5\u306B\u5931\u6557\u3057\u307E\u3057\u305F</h1>\n                <p>\u30A2\u30D7\u30EA\u30B1\u30FC\u30B7\u30E7\u30F3\u3092\u518D\u30A4\u30F3\u30B9\u30C8\u30FC\u30EB\u3057\u3066\u304F\u3060\u3055\u3044\u3002</p>\n                <p>\u30A8\u30E9\u30FC: ".concat(err_2, "</p>\n              </body>\n            </html>")))];
                case 11:
                    _a.sent();
                    return [3 /*break*/, 12];
                case 12:
                    // ウィンドウが閉じられたときの処理
                    mainWindow.on("closed", function () {
                        mainWindow = null;
                        // 本番モードの場合、サーバーも停止
                        if (!utils_1.isDev) {
                            (0, server_1.stopNextServer)();
                        }
                    });
                    return [2 /*return*/, mainWindow];
            }
        });
    });
}
//# sourceMappingURL=window-manager.js.map