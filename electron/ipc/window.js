"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupWindowHandlers = setupWindowHandlers;
var electron_1 = require("electron");
function setupWindowHandlers() {
    // ウィンドウ制御
    electron_1.ipcMain.handle("window-minimize", function (event) {
        var win = electron_1.BrowserWindow.fromWebContents(event.sender);
        win === null || win === void 0 ? void 0 : win.minimize();
    });
    electron_1.ipcMain.handle("window-maximize", function (event) {
        var win = electron_1.BrowserWindow.fromWebContents(event.sender);
        if (win === null || win === void 0 ? void 0 : win.isMaximized()) {
            win.unmaximize();
        }
        else {
            win === null || win === void 0 ? void 0 : win.maximize();
        }
    });
    electron_1.ipcMain.handle("window-close", function (event) {
        var win = electron_1.BrowserWindow.fromWebContents(event.sender);
        // アプリケーションの仕様として、closeではなくhideする場合が多いが
        // main.tsの実装に合わせて hide() を呼ぶ
        win === null || win === void 0 ? void 0 : win.hide();
    });
}
//# sourceMappingURL=window.js.map