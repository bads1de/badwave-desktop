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
// グローバル参照を保持（ガベージコレクションを防ぐため）
var mainWindow = null;
// メインウィンドウの取得
function getMainWindow() {
    return mainWindow;
}
// メインウィンドウの作成
function createMainWindow() {
    return __awaiter(this, void 0, void 0, function () {
        var isMac, err_1, deployErr_1, err_2;
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
                    // 開発モードの場合
                    if (utils_1.isDev) {
                        console.log("isDev =", utils_1.isDev, "process.env.NODE_ENV =", process.env.NODE_ENV, "app.isPackaged =", electron_1.app.isPackaged);
                    }
                    if (!utils_1.isDev) return [3 /*break*/, 10];
                    console.log("開発モードで起動しています");
                    mainWindow.webContents.openDevTools();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 9]);
                    // 開発サーバーが起動しているか確認
                    console.log("ローカル開発サーバー(http://localhost:3000)に接続を試みます...");
                    return [4 /*yield*/, mainWindow.loadURL("http://localhost:3000")];
                case 2:
                    _a.sent();
                    console.log("開発サーバーに接続しました");
                    return [3 /*break*/, 9];
                case 3:
                    err_1 = _a.sent();
                    console.error("開発サーバーへの接続に失敗しました:", err_1);
                    console.log("デプロイ済みのURLに接続を試みます...");
                    _a.label = 4;
                case 4:
                    _a.trys.push([4, 6, , 8]);
                    // デプロイ済みのURLに接続
                    return [4 /*yield*/, mainWindow.loadURL("https://badwave-desktop.vercel.app/")];
                case 5:
                    // デプロイ済みのURLに接続
                    _a.sent();
                    console.log("デプロイ済みのURLに接続しました");
                    return [3 /*break*/, 8];
                case 6:
                    deployErr_1 = _a.sent();
                    console.error("デプロイ済みのURLへの接続にも失敗しました:", deployErr_1);
                    // 両方とも失敗した場合はエラーメッセージを表示
                    return [4 /*yield*/, mainWindow.loadURL("data:text/html;charset=utf-8," +
                            encodeURIComponent("<html><body><h1>エラー</h1><p>開発サーバーとデプロイ済みのURLどちらにも接続できませんでした。</p><p>インターネット接続を確認してください。</p></body></html>"))];
                case 7:
                    // 両方とも失敗した場合はエラーメッセージを表示
                    _a.sent();
                    return [3 /*break*/, 8];
                case 8: return [3 /*break*/, 9];
                case 9: return [3 /*break*/, 15];
                case 10:
                    // 本番モードではDevToolsを開かない
                    mainWindow.webContents.closeDevTools();
                    _a.label = 11;
                case 11:
                    _a.trys.push([11, 13, , 15]);
                    // 外部URLに直接接続
                    return [4 /*yield*/, mainWindow.loadURL("https://badwave-desktop.vercel.app/")];
                case 12:
                    // 外部URLに直接接続
                    _a.sent();
                    return [3 /*break*/, 15];
                case 13:
                    err_2 = _a.sent();
                    // 接続に失敗した場合はエラーメッセージを表示
                    return [4 /*yield*/, mainWindow.loadURL("data:text/html;charset=utf-8," +
                            encodeURIComponent("<html><body><h1>エラー</h1><p>アプリケーションの起動に失敗しました。</p><p>インターネット接続を確認してください。</p></body></html>"))];
                case 14:
                    // 接続に失敗した場合はエラーメッセージを表示
                    _a.sent();
                    return [3 /*break*/, 15];
                case 15:
                    // ウィンドウが閉じられたときの処理
                    mainWindow.on("closed", function () {
                        mainWindow = null;
                    });
                    return [2 /*return*/, mainWindow];
            }
        });
    });
}
//# sourceMappingURL=window-manager.js.map