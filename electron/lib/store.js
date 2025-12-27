"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
var electron_store_1 = __importDefault(require("electron-store"));
// 設定ストアの初期化
var store = new electron_store_1.default({
    name: "badwave-settings", // 設定ファイルの名前
    clearInvalidConfig: true, // 無効な設定を自動的にクリア
    cwd: electron_1.app.getPath("userData"), // 開発モードでも同じ場所に保存するための設定
});
exports.default = store;
//# sourceMappingURL=store.js.map