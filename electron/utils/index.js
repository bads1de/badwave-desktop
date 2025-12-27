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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDev = void 0;
exports.loadEnvVariables = loadEnvVariables;
exports.debugLog = debugLog;
var electron_1 = require("electron");
var path = __importStar(require("path"));
var fs = __importStar(require("fs"));
var dotenv = __importStar(require("dotenv"));
/**
 * .env.localファイルから環境変数を読み込む
 *
 * @returns {boolean} 環境変数の読み込みに成功したかどうか
 */
function loadEnvVariables() {
    try {
        var envPath = path.join(electron_1.app.getAppPath(), ".env.local");
        if (fs.existsSync(envPath)) {
            console.log("Loading environment variables from:", envPath);
            var envConfig = dotenv.parse(fs.readFileSync(envPath));
            for (var key in envConfig) {
                process.env[key] = envConfig[key];
            }
            return true;
        }
        else {
            console.warn(".env.localファイルが見つかりません:", envPath);
            return false;
        }
    }
    catch (error) {
        console.error("環境変数の読み込み中にエラーが発生しました:", error);
        return false;
    }
}
/**
 * 開発モードかどうかを判定
 */
exports.isDev = process.env.NODE_ENV !== "production" || !electron_1.app.isPackaged;
/**
 * 条件付きでログを出力する
 * 開発モードの場合のみログを出力
 *
 * @param {string} message - ログメッセージ
 * @param {any[]} args - 追加の引数
 */
function debugLog(message) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    if (exports.isDev) {
        console.log.apply(console, __spreadArray([message], args, false));
    }
}
//# sourceMappingURL=index.js.map