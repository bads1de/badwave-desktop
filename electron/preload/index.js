"use strict";
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
var electron_1 = require("electron");
// チャンネル検証用の共通関数
function validateChannel(channel, allowedChannels) {
    if (!allowedChannels.includes(channel)) {
        throw new Error("Channel \"".concat(channel, "\" is not allowed for security reasons."));
    }
    return true;
}
// 許可されたチャンネルのリスト
var ALLOWED_INVOKE_CHANNELS = [
    "get-store-value",
    "set-store-value",
    "window-minimize",
    "window-maximize",
    "window-close",
    "api-request",
    "handle-select-directory",
    "handle-scan-mp3-files",
    "handle-get-mp3-metadata",
    "handle-get-saved-music-library",
    "download-song",
    "check-file-exists",
    "get-local-file-path",
    "delete-song",
    // Phase 2: Offline handlers
    "get-offline-songs",
    "delete-offline-song",
    "check-offline-status",
    // 開発用: オフラインシミュレーション
    "toggle-offline-simulation",
    "get-offline-simulation-status",
    "set-offline-simulation",
    // キャッシュハンドラー（オフラインライブラリ表示用）
    "sync-songs-metadata",
    "sync-playlists",
    "sync-playlist-songs",
    "sync-liked-songs",
    "sync-spotlights-metadata",
    "sync-section",
    "get-section-data",
    "get-cached-playlists",
    "get-cached-liked-songs",
    "get-cached-playlist-songs",
    "debug-dump-db",
    // Local-first mutation handlers
    "add-liked-song",
    "remove-liked-song",
    "get-like-status",
    "add-playlist-song",
    "remove-playlist-song",
    // 認証キャッシュ
    "save-cached-user",
    "get-cached-user",
    "clear-cached-user",
    "get-song-by-id",
    "get-playlist-by-id",
    // ページネーション対応ハンドラー
    "get-songs-paginated",
    "get-songs-total-count",
];
var ALLOWED_ON_CHANNELS = [
    "media-control",
    "download-progress",
    "offline-simulation-changed",
];
var ALLOWED_SEND_CHANNELS = ["log", "player-state-change"];
// Electronの機能をウィンドウオブジェクトに安全に公開
electron_1.contextBridge.exposeInMainWorld("electron", {
    // アプリケーション情報
    appInfo: {
        getVersion: function () { return process.env.npm_package_version; },
        isElectron: true,
        platform: process.platform,
    },
    // ウィンドウ操作
    window: {
        minimize: function () { return electron_1.ipcRenderer.invoke("window-minimize"); },
        maximize: function () { return electron_1.ipcRenderer.invoke("window-maximize"); },
        close: function () { return electron_1.ipcRenderer.invoke("window-close"); },
    },
    // 設定ストア操作
    store: {
        get: function (key) { return electron_1.ipcRenderer.invoke("get-store-value", key); },
        set: function (key, value) {
            return electron_1.ipcRenderer.invoke("set-store-value", key, value);
        },
    },
    // メディア制御
    media: {
        // メディア制御イベントのリスナーを登録
        onMediaControl: function (callback) {
            var subscription = function (_, action) { return callback(action); };
            electron_1.ipcRenderer.on("media-control", subscription);
            // リスナーの登録解除関数を返す
            return function () {
                electron_1.ipcRenderer.removeListener("media-control", subscription);
            };
        },
    },
    // オフライン機能 (Phase 2)
    offline: {
        // オフライン（ダウンロード済み）の曲を全て取得
        getSongs: function () { return electron_1.ipcRenderer.invoke("get-offline-songs"); },
        // 曲がダウンロード済みかチェック
        checkStatus: function (songId) {
            return electron_1.ipcRenderer.invoke("check-offline-status", songId);
        },
        // オフライン曲を削除（ファイル + DB）
        deleteSong: function (songId) {
            return electron_1.ipcRenderer.invoke("delete-offline-song", songId);
        },
        // 曲をダウンロード（メタデータ付き）
        downloadSong: function (song) { return electron_1.ipcRenderer.invoke("download-song", song); },
    },
    // 開発用ユーティリティ
    dev: {
        // オフラインシミュレーションを切り替え
        toggleOfflineSimulation: function () {
            return electron_1.ipcRenderer.invoke("toggle-offline-simulation");
        },
        // 現在のオフラインシミュレーション状態を取得
        getOfflineSimulationStatus: function () {
            return electron_1.ipcRenderer.invoke("get-offline-simulation-status");
        },
        // オフラインシミュレーションを明示的に設定
        setOfflineSimulation: function (offline) {
            return electron_1.ipcRenderer.invoke("set-offline-simulation", offline);
        },
    },
    // キャッシュ機能（オフラインライブラリ表示用）
    cache: {
        // 曲のメタデータをキャッシュ
        syncSongsMetadata: function (songs) {
            return electron_1.ipcRenderer.invoke("sync-songs-metadata", songs);
        },
        // プレイリストをキャッシュ
        syncPlaylists: function (playlists) {
            return electron_1.ipcRenderer.invoke("sync-playlists", playlists);
        },
        // プレイリスト内の曲をキャッシュ
        syncPlaylistSongs: function (data) {
            return electron_1.ipcRenderer.invoke("sync-playlist-songs", data);
        },
        // いいねをキャッシュ
        syncLikedSongs: function (data) { return electron_1.ipcRenderer.invoke("sync-liked-songs", data); },
        // スポットライトをキャッシュ
        syncSpotlightsMetadata: function (data) {
            return electron_1.ipcRenderer.invoke("sync-spotlights-metadata", data);
        },
        // セクションをキャッシュ
        syncSection: function (data) {
            return electron_1.ipcRenderer.invoke("sync-section", data);
        },
        // キャッシュからセクションデータを取得
        getSectionData: function (key, type) {
            return electron_1.ipcRenderer.invoke("get-section-data", { key: key, type: type });
        },
        // キャッシュからプレイリストを取得
        getCachedPlaylists: function (userId) {
            return electron_1.ipcRenderer.invoke("get-cached-playlists", userId);
        },
        // キャッシュからいいね曲を取得
        getCachedLikedSongs: function (userId) {
            return electron_1.ipcRenderer.invoke("get-cached-liked-songs", userId);
        },
        // キャッシュからプレイリスト内の曲を取得
        getCachedPlaylistSongs: function (playlistId) {
            return electron_1.ipcRenderer.invoke("get-cached-playlist-songs", playlistId);
        },
        // DBの中身をダンプ (デバッグ用)
        debugDumpDb: function () { return electron_1.ipcRenderer.invoke("debug-dump-db"); },
        // Local-first mutation methods
        addLikedSong: function (data) {
            return electron_1.ipcRenderer.invoke("add-liked-song", data);
        },
        removeLikedSong: function (data) {
            return electron_1.ipcRenderer.invoke("remove-liked-song", data);
        },
        getLikeStatus: function (data) {
            return electron_1.ipcRenderer.invoke("get-like-status", data);
        },
        addPlaylistSong: function (data) {
            return electron_1.ipcRenderer.invoke("add-playlist-song", data);
        },
        removePlaylistSong: function (data) {
            return electron_1.ipcRenderer.invoke("remove-playlist-song", data);
        },
        // 単一の曲情報を取得（ローカルDB）
        getSongById: function (songId) {
            return electron_1.ipcRenderer.invoke("get-song-by-id", songId);
        },
        // 単一のプレイリスト情報を取得（ローカルDB）
        getPlaylistById: function (playlistId) {
            return electron_1.ipcRenderer.invoke("get-playlist-by-id", playlistId);
        },
        // ページネーション対応の曲取得
        getSongsPaginated: function (offset, limit) {
            return electron_1.ipcRenderer.invoke("get-songs-paginated", { offset: offset, limit: limit });
        },
        // 曲の総件数を取得
        getSongsTotalCount: function () { return electron_1.ipcRenderer.invoke("get-songs-total-count"); },
    },
    // 認証キャッシュ（オフラインログイン用）
    auth: {
        // ユーザー情報を保存
        saveCachedUser: function (user) { return electron_1.ipcRenderer.invoke("save-cached-user", user); },
        // ユーザー情報を取得
        getCachedUser: function () { return electron_1.ipcRenderer.invoke("get-cached-user"); },
        // ユーザー情報をクリア
        clearCachedUser: function () { return electron_1.ipcRenderer.invoke("clear-cached-user"); },
    },
    // IPC通信
    ipc: {
        // メインプロセスにメッセージを送信し、応答を待つ
        invoke: function (channel) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            if (validateChannel(channel, ALLOWED_INVOKE_CHANNELS)) {
                return electron_1.ipcRenderer.invoke.apply(electron_1.ipcRenderer, __spreadArray([channel], args, false));
            }
        },
        // メインプロセスからのメッセージを受信
        on: function (channel, callback) {
            if (validateChannel(channel, ALLOWED_ON_CHANNELS)) {
                var subscription_1 = function (_) {
                    var args = [];
                    for (var _i = 1; _i < arguments.length; _i++) {
                        args[_i - 1] = arguments[_i];
                    }
                    return callback.apply(void 0, args);
                };
                electron_1.ipcRenderer.on(channel, subscription_1);
                // リスナーの登録解除関数を返す
                return function () {
                    electron_1.ipcRenderer.removeListener(channel, subscription_1);
                };
            }
        },
        // メインプロセスにメッセージを送信（応答を待たない）
        send: function (channel) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            if (validateChannel(channel, ALLOWED_SEND_CHANNELS)) {
                electron_1.ipcRenderer.send.apply(electron_1.ipcRenderer, __spreadArray([channel], args, false));
            }
        },
    },
});
// コンソールにプリロードスクリプトが実行されたことを表示
console.log("Preload script has been loaded");
//# sourceMappingURL=index.js.map