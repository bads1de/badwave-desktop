"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSettingsHandlers = setupSettingsHandlers;
var electron_1 = require("electron");
var store_1 = __importDefault(require("../lib/store"));
function setupSettingsHandlers() {
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
}
//# sourceMappingURL=settings.js.map