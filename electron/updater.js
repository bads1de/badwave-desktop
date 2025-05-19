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
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupAutoUpdater = setupAutoUpdater;
exports.manualCheckForUpdates = manualCheckForUpdates;
var electron_1 = require("electron");
var os = __importStar(require("os"));
var utils_1 = require("./utils");
/**
 * 自動アップデート機能の設定
 * @param mainWindow メインウィンドウのインスタンス
 */
function setupAutoUpdater(mainWindow) {
    // 開発モードでは自動アップデートを無効化
    if (utils_1.isDev) {
        console.log("開発モードのため、自動アップデートは無効化されています");
        return;
    }
    // macOSの場合は署名が必要
    if (process.platform === "darwin") {
        // アップデートサーバーのURL
        // 実際のURLに置き換える必要があります
        electron_1.autoUpdater.setFeedURL({
            url: "https://your-update-server.com/update/".concat(process.platform, "/").concat(electron_1.app.getVersion()),
            headers: {
                "User-Agent": "".concat(electron_1.app.getName(), "/").concat(electron_1.app.getVersion(), " (").concat(os.platform(), " ").concat(os.arch(), ")"),
            },
        });
    }
    // アップデートのチェック間隔（1時間）
    var CHECK_INTERVAL = 60 * 60 * 1000;
    // 定期的にアップデートをチェック
    setInterval(function () {
        checkForUpdates();
    }, CHECK_INTERVAL);
    // 起動時に一度チェック
    checkForUpdates();
    // アップデートが利用可能になったとき
    electron_1.autoUpdater.on("update-available", function () {
        console.log("アップデートが利用可能です");
        // メインウィンドウにアップデート情報を送信
        mainWindow.webContents.send("update-available");
    });
    // アップデートのダウンロード進捗
    // @ts-ignore - Electronの型定義が不完全なため
    electron_1.autoUpdater.on("download-progress", function (progressObj) {
        console.log("\u30C0\u30A6\u30F3\u30ED\u30FC\u30C9\u9032\u6357: ".concat(progressObj.percent, "%"));
        // メインウィンドウにダウンロード進捗を送信
        mainWindow.webContents.send("download-progress", progressObj);
    });
    // アップデートのダウンロードが完了したとき
    electron_1.autoUpdater.on("update-downloaded", function (_event, releaseNotes, releaseName) {
        console.log("アップデートのダウンロードが完了しました");
        // メインウィンドウにアップデート完了を通知
        mainWindow.webContents.send("update-downloaded", {
            releaseNotes: releaseNotes,
            releaseName: releaseName,
        });
        // ダイアログを表示
        var dialogOpts = {
            type: "info",
            buttons: ["再起動", "後で"],
            title: "アプリケーションアップデート",
            message: process.platform === "win32" ? releaseNotes : releaseName,
            detail: "アップデートがダウンロードされました。アプリケーションを再起動して適用しますか？",
        };
        electron_1.dialog.showMessageBox(dialogOpts).then(function (returnValue) {
            if (returnValue.response === 0) {
                // 「再起動」ボタンが押された場合
                electron_1.autoUpdater.quitAndInstall();
            }
        });
    });
    // エラーが発生したとき
    electron_1.autoUpdater.on("error", function (error) {
        console.error("アップデート中にエラーが発生しました:", error);
    });
}
/**
 * アップデートをチェックする共通関数
 *
 * @param {boolean} isManual - 手動チェックかどうか
 * @returns {boolean} アップデートのチェックが開始されたかどうか
 */
function checkForUpdatesCore(isManual) {
    if (isManual === void 0) { isManual = false; }
    try {
        // 開発モードではアップデートチェックをスキップ
        if (utils_1.isDev) {
            console.log("開発モードのため、アップデートチェックをスキップします");
            return true;
        }
        // アップデートURLが設定されているか確認
        // 開発中は警告を表示するだけで続行
        if (!process.env.UPDATE_SERVER_URL) {
            console.warn("アップデートURLが設定されていません - 開発モードでは無視されます");
            return true; // 開発モードでは成功として扱う
        }
        electron_1.autoUpdater.checkForUpdates();
        return true;
    }
    catch (error) {
        var errorMessage = isManual
            ? "手動アップデートチェック中にエラーが発生しました:"
            : "アップデートのチェック中にエラーが発生しました:";
        console.error(errorMessage, error);
        return false;
    }
}
/**
 * 自動アップデートをチェックする
 * 戻り値を返さないバージョン（定期チェック用）
 */
function checkForUpdates() {
    checkForUpdatesCore(false);
}
/**
 * 手動でアップデートをチェックする
 * @returns アップデートのチェックが開始されたかどうか
 */
function manualCheckForUpdates() {
    return checkForUpdatesCore(true);
}
//# sourceMappingURL=updater.js.map