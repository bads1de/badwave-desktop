"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupDevShortcuts = setupDevShortcuts;
var electron_1 = require("electron");
var window_manager_1 = require("../lib/window-manager");
var utils_1 = require("../utils");
var settings_1 = require("../ipc/settings");
/**
 * 開発用ショートカットキーのセットアップ
 */
function setupDevShortcuts() {
    // Ctrl+Shift+O: オフラインモードのトグル
    electron_1.globalShortcut.register("CommandOrControl+Shift+O", function () {
        // settings.ts の状態を更新
        var newState = !(0, settings_1.getIsSimulatingOffline)();
        (0, settings_1.setIsSimulatingOffline)(newState);
        var mainWindow = (0, window_manager_1.getMainWindow)();
        if (mainWindow) {
            // 1. ネットワークエミュレーションの設定
            mainWindow.webContents.session.enableNetworkEmulation({
                offline: newState,
            });
            // 2. WebRequestによる強制ブロック (localhost以外)
            var filter = { urls: ["*://*/*"] };
            if (newState) {
                electron_1.session.defaultSession.webRequest.onBeforeRequest(filter, function (details, callback) {
                    if (details.url.includes("localhost") ||
                        details.url.includes("127.0.0.1")) {
                        callback({ cancel: false });
                    }
                    else {
                        callback({ cancel: true });
                    }
                });
            }
            else {
                electron_1.session.defaultSession.webRequest.onBeforeRequest(filter, null);
            }
            // レンダラーに通知を送信
            mainWindow.webContents.send("offline-simulation-changed", newState);
        }
        (0, utils_1.debugLog)("[Shortcut] Offline simulation: ".concat(newState ? "ON" : "OFF", " (Ctrl+Shift+O)"));
    });
    // Ctrl+Shift+I: DevToolsを開く
    electron_1.globalShortcut.register("CommandOrControl+Shift+I", function () {
        var mainWindow = (0, window_manager_1.getMainWindow)();
        if (mainWindow) {
            mainWindow.webContents.openDevTools();
        }
    });
    (0, utils_1.debugLog)("Ctrl+Shift+I = Open DevTools, Ctrl+Shift+O = Toggle Offline Mode");
}
//# sourceMappingURL=index.js.map