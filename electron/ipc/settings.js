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
exports.setupSettingsHandlers = setupSettingsHandlers;
var electron_1 = require("electron");
var store_1 = __importDefault(require("../lib/store"));
var utils_1 = require("../utils");
// オフラインシミュレーション状態を追跡
var isSimulatingOffline = false;
function setupSettingsHandlers() {
    var _this = this;
    // アプリケーション設定の取得
    electron_1.ipcMain.handle("get-store-value", function (_, key) {
        return store_1.default.get(key);
    });
    // アプリケーション設定の保存
    electron_1.ipcMain.handle("set-store-value", function (_, key, value) {
        // 設定値をストアに直接保存
        store_1.default.set(key, value);
        return true;
    });
    // オフラインモードのシミュレーションを切り替え（開発用）
    electron_1.ipcMain.handle("toggle-offline-simulation", function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            isSimulatingOffline = !isSimulatingOffline;
            electron_1.session.defaultSession.enableNetworkEmulation({
                offline: isSimulatingOffline,
            });
            (0, utils_1.debugLog)("[Debug] Offline simulation: ".concat(isSimulatingOffline ? "ON" : "OFF"));
            return [2 /*return*/, { isOffline: isSimulatingOffline }];
        });
    }); });
    // 現在のオフラインシミュレーション状態を取得
    electron_1.ipcMain.handle("get-offline-simulation-status", function () {
        return { isOffline: isSimulatingOffline };
    });
    // オフラインシミュレーションを設定（明示的に ON/OFF）
    electron_1.ipcMain.handle("set-offline-simulation", function (_, offline) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            isSimulatingOffline = offline;
            electron_1.session.defaultSession.enableNetworkEmulation({
                offline: isSimulatingOffline,
            });
            (0, utils_1.debugLog)("[Debug] Offline simulation set to: ".concat(isSimulatingOffline ? "ON" : "OFF"));
            return [2 /*return*/, { isOffline: isSimulatingOffline }];
        });
    }); });
}
//# sourceMappingURL=settings.js.map