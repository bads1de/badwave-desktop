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
exports.setupTray = setupTray;
exports.destroyTray = destroyTray;
var electron_1 = require("electron");
var path = __importStar(require("path"));
var fs = __importStar(require("fs"));
var window_manager_1 = require("./window-manager");
var tray = null;
// システムトレイの設定
function setupTray() {
    try {
        // 利用可能なすべてのパスを試す
        var possiblePaths = [];
        // 開発環境のパス
        var appPath = electron_1.app.getAppPath();
        possiblePaths.push(path.join(appPath, "public", "logo.png"));
        // 本番環境の可能性のあるパス
        if (electron_1.app.isPackaged) {
            var resourcePath = process.resourcesPath;
            var exePath = path.dirname(electron_1.app.getPath("exe"));
            // リソースディレクトリ内のパス
            possiblePaths.push(path.join(resourcePath, "app.asar.unpacked", "public", "logo.png"));
            possiblePaths.push(path.join(resourcePath, "app.asar.unpacked", "build", "logo.png"));
            possiblePaths.push(path.join(resourcePath, "logo.png"));
            // 実行ファイルディレクトリ内のパス
            possiblePaths.push(path.join(exePath, "resources", "logo.png"));
            possiblePaths.push(path.join(exePath, "resources", "app.asar.unpacked", "public", "logo.png"));
            possiblePaths.push(path.join(exePath, "public", "logo.png"));
            // その他の可能性のあるパス
            possiblePaths.push(path.join(resourcePath, "public", "logo.png"));
            possiblePaths.push(path.join(resourcePath, "..", "public", "logo.png"));
            possiblePaths.push(path.join(exePath, "..", "resources", "public", "logo.png"));
        }
        // 存在するパスを見つける
        var pngPath = null;
        for (var _i = 0, possiblePaths_1 = possiblePaths; _i < possiblePaths_1.length; _i++) {
            var p = possiblePaths_1[_i];
            if (fs.existsSync(p)) {
                pngPath = p;
                break;
            }
        }
        // ファイルの存在確認
        if (!pngPath || !fs.existsSync(pngPath)) {
            throw new Error("\u30A2\u30A4\u30B3\u30F3\u30D5\u30A1\u30A4\u30EB\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093");
        }
        // nativeImageを作成
        var icon = void 0;
        try {
            // ファイルの内容を読み込んでバッファとして保持
            var iconBuffer = fs.readFileSync(pngPath);
            // バッファからnativeImageを作成
            icon = electron_1.nativeImage.createFromBuffer(iconBuffer);
            // アイコンが空でないか確認
            if (icon.isEmpty()) {
                throw new Error("アイコンイメージが空です");
            }
            // アイコンをリサイズ（システムトレイに適したサイズに）
            icon = icon.resize({
                width: 24,
                height: 24,
                quality: "best",
            });
        }
        catch (imgError) {
            // 代替方法: 組み込みのアイコンを使用
            try {
                // Electronの組み込みアイコンを使用
                var electronPath = require.resolve("electron");
                var electronDir = path.dirname(electronPath);
                var defaultIconPath = path.join(electronDir, "default_app.asar", "icon.png");
                if (fs.existsSync(defaultIconPath)) {
                    icon = electron_1.nativeImage.createFromPath(defaultIconPath);
                }
                else {
                    icon = electron_1.nativeImage.createEmpty();
                }
            }
            catch (fallbackError) {
                // 最終手段: 空のイメージを作成
                icon = electron_1.nativeImage.createEmpty();
            }
        }
        // トレイを作成
        tray = new electron_1.Tray(icon);
        // コンテキストメニューを作成
        try {
            // メニューテンプレートを作成
            var menuTemplate = [
                { label: "BadWave", enabled: false },
                { type: "separator" },
                {
                    label: "再生/一時停止",
                    click: function () {
                        var mainWindow = (0, window_manager_1.getMainWindow)();
                        if (mainWindow && !mainWindow.isDestroyed()) {
                            mainWindow.webContents.send("media-control", "play-pause");
                        }
                    },
                },
                {
                    label: "次の曲",
                    click: function () {
                        var mainWindow = (0, window_manager_1.getMainWindow)();
                        if (mainWindow && !mainWindow.isDestroyed()) {
                            mainWindow.webContents.send("media-control", "next");
                        }
                    },
                },
                {
                    label: "前の曲",
                    click: function () {
                        var mainWindow = (0, window_manager_1.getMainWindow)();
                        if (mainWindow && !mainWindow.isDestroyed()) {
                            mainWindow.webContents.send("media-control", "previous");
                        }
                    },
                },
                { type: "separator" },
                {
                    label: "アプリを表示",
                    click: function () {
                        var mainWindow = (0, window_manager_1.getMainWindow)();
                        if (mainWindow && !mainWindow.isDestroyed()) {
                            mainWindow.show();
                            mainWindow.focus();
                        }
                        else {
                            (0, window_manager_1.createMainWindow)();
                        }
                    },
                },
                {
                    label: "終了",
                    click: function () {
                        electron_1.app.quit();
                    },
                },
            ];
            // メニューを構築
            var contextMenu = electron_1.Menu.buildFromTemplate(menuTemplate);
            // トレイにメニューを設定
            tray.setToolTip("BadWave");
            tray.setContextMenu(contextMenu);
            // トレイアイコンのクリックでウィンドウを表示/非表示
            tray.on("click", function () {
                var mainWindow = (0, window_manager_1.getMainWindow)();
                if (mainWindow && !mainWindow.isDestroyed()) {
                    if (mainWindow.isVisible()) {
                        mainWindow.hide();
                    }
                    else {
                        mainWindow.show();
                        mainWindow.focus();
                    }
                }
                else {
                    (0, window_manager_1.createMainWindow)();
                }
            });
        }
        catch (menuError) {
            // エラーが発生した場合でもアプリケーションは続行
        }
    }
    catch (error) {
        // エラーが発生した場合でもアプリケーションは続行
        // 空のトレイオブジェクトを作成して最低限の機能を提供
        try {
            if (!tray) {
                // Base64エンコードされた最小限のアイコン（1x1ピクセルの透明PNG）
                var transparentPixel = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
                var iconBuffer = Buffer.from(transparentPixel, "base64");
                try {
                    var emptyIcon = electron_1.nativeImage.createFromBuffer(iconBuffer);
                    tray = new electron_1.Tray(emptyIcon);
                }
                catch (iconError) {
                    var emptyIcon = electron_1.nativeImage.createEmpty();
                    tray = new electron_1.Tray(emptyIcon);
                }
                tray.setToolTip("BadWave");
                // 最小限のコンテキストメニュー
                var fallbackMenu = electron_1.Menu.buildFromTemplate([
                    {
                        label: "BadWave",
                        enabled: false,
                    },
                    { type: "separator" },
                    {
                        label: "アプリを表示",
                        click: function () {
                            var mainWindow = (0, window_manager_1.getMainWindow)();
                            if (mainWindow && !mainWindow.isDestroyed()) {
                                mainWindow.show();
                                mainWindow.focus();
                            }
                            else {
                                (0, window_manager_1.createMainWindow)();
                            }
                        },
                    },
                    {
                        label: "終了",
                        click: function () {
                            electron_1.app.quit();
                        },
                    },
                ]);
                tray.setContextMenu(fallbackMenu);
            }
        }
        catch (fallbackError) {
            // フォールバックトレイの作成に失敗した場合も続行
        }
    }
}
// アプリ終了時にトレイを破棄
function destroyTray() {
    if (tray) {
        tray.destroy();
    }
}
//# sourceMappingURL=tray.js.map