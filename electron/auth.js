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
exports.setupAuth = setupAuth;
var electron_1 = require("electron");
var supabase_js_1 = require("@supabase/supabase-js");
var path = __importStar(require("path"));
var fs = __importStar(require("fs"));
var dotenv = __importStar(require("dotenv"));
// .env.localファイルを読み込む
var envPath = path.join(electron_1.app.getAppPath(), ".env.local");
if (fs.existsSync(envPath)) {
    console.log("Loading environment variables from:", envPath);
    var envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (var key in envConfig) {
        process.env[key] = envConfig[key];
    }
}
else {
    console.warn(".env.localファイルが見つかりません:", envPath);
}
// 環境変数の確認
var supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
var supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase環境変数が設定されていません:");
    console.error("NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl);
    console.error("NEXT_PUBLIC_SUPABASE_ANON_KEY:", supabaseAnonKey ? "設定済み" : "未設定");
}
// Supabaseクライアントの作成
var supabase = (0, supabase_js_1.createClient)(supabaseUrl || "", supabaseAnonKey || "");
/**
 * Electronアプリでの認証処理を設定する
 * @param mainWindow メインウィンドウ
 */
function setupAuth(mainWindow) {
    var _this = this;
    // ログインリクエストを処理
    electron_1.ipcMain.handle("auth:signIn", function (event_1, _a) { return __awaiter(_this, [event_1, _a], void 0, function (event, _b) {
        var _c, data, error, error_1;
        var email = _b.email, password = _b.password;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _d.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, supabase.auth.signInWithPassword({
                            email: email,
                            password: password,
                        })];
                case 1:
                    _c = _d.sent(), data = _c.data, error = _c.error;
                    if (error)
                        throw error;
                    return [2 /*return*/, { data: data }];
                case 2:
                    error_1 = _d.sent();
                    console.error("ログインエラー:", error_1);
                    return [2 /*return*/, { error: error_1 }];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    // サインアップリクエストを処理
    electron_1.ipcMain.handle("auth:signUp", function (event_1, _a) { return __awaiter(_this, [event_1, _a], void 0, function (event, _b) {
        var _c, data, error, error_2;
        var email = _b.email, password = _b.password, fullName = _b.fullName;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _d.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, supabase.auth.signUp({
                            email: email,
                            password: password,
                            options: {
                                data: {
                                    full_name: fullName,
                                },
                            },
                        })];
                case 1:
                    _c = _d.sent(), data = _c.data, error = _c.error;
                    if (error)
                        throw error;
                    return [2 /*return*/, { data: data }];
                case 2:
                    error_2 = _d.sent();
                    console.error("サインアップエラー:", error_2);
                    return [2 /*return*/, { error: error_2 }];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    // ログアウトリクエストを処理
    electron_1.ipcMain.handle("auth:signOut", function () { return __awaiter(_this, void 0, void 0, function () {
        var error, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, supabase.auth.signOut()];
                case 1:
                    error = (_a.sent()).error;
                    if (error)
                        throw error;
                    return [2 /*return*/, { success: true }];
                case 2:
                    error_3 = _a.sent();
                    console.error("ログアウトエラー:", error_3);
                    return [2 /*return*/, { error: error_3 }];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    // 現在のセッションを取得
    electron_1.ipcMain.handle("auth:getSession", function () { return __awaiter(_this, void 0, void 0, function () {
        var _a, data, error, error_4;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, supabase.auth.getSession()];
                case 1:
                    _a = _b.sent(), data = _a.data, error = _a.error;
                    if (error)
                        throw error;
                    return [2 /*return*/, { data: data }];
                case 2:
                    error_4 = _b.sent();
                    console.error("セッション取得エラー:", error_4);
                    return [2 /*return*/, { error: error_4 }];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    // OAuth認証を処理
    electron_1.ipcMain.handle("auth:signInWithOAuth", function (event_1, _a) { return __awaiter(_this, [event_1, _a], void 0, function (event, _b) {
        var _c, data, error, authWindow, error_5;
        var provider = _b.provider;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _d.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, supabase.auth.signInWithOAuth({
                            provider: provider,
                            options: {
                                redirectTo: "badwave://auth/callback",
                            },
                        })];
                case 1:
                    _c = _d.sent(), data = _c.data, error = _c.error;
                    if (error)
                        throw error;
                    authWindow = new electron_1.BrowserWindow({
                        width: 800,
                        height: 600,
                        webPreferences: {
                            nodeIntegration: false,
                            contextIsolation: true,
                        },
                        parent: mainWindow,
                        modal: true,
                    });
                    // OAuthプロバイダーのURLに移動
                    authWindow.loadURL(data.url);
                    // ウィンドウが閉じられたときのハンドラー
                    authWindow.on("closed", function () {
                        // セッションを確認
                        supabase.auth.getSession().then(function (_a) {
                            var data = _a.data;
                            if (data.session) {
                                mainWindow.webContents.send("auth:sessionUpdated", data);
                            }
                        });
                    });
                    return [2 /*return*/, { success: true }];
                case 2:
                    error_5 = _d.sent();
                    console.error("OAuth認証エラー:", error_5);
                    return [2 /*return*/, { error: error_5 }];
                case 3: return [2 /*return*/];
            }
        });
    }); });
}
//# sourceMappingURL=auth.js.map