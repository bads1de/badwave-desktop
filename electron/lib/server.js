"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.startNextServer = startNextServer;
exports.stopNextServer = stopNextServer;
exports.getServerPort = getServerPort;
var electron_1 = require("electron");
var path = __importStar(require("path"));
var http = __importStar(require("http"));
var child_process_1 = require("child_process");
var utils_1 = require("../utils");
var serverProcess = null;
var serverPort = 3000;
/**
 * Next.js Standaloneサーバーを起動する
 * 本番モードでのみ使用される
 */
function startNextServer() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    // Standaloneサーバーのパスを構築
                    // パッケージ化後: resources/standalone/server.js
                    var serverPath = electron_1.app.isPackaged
                        ? path.join(process.resourcesPath, "standalone", "server.js")
                        : path.join(electron_1.app.getAppPath(), ".next", "standalone", "server.js");
                    (0, utils_1.debugLog)("Starting Next.js server from: ".concat(serverPath));
                    // 空きポートを探す
                    findAvailablePort(3000).then(function (port) {
                        var _a, _b;
                        serverPort = port;
                        // 環境変数を設定
                        var env = __assign(__assign({}, process.env), { PORT: String(port), HOSTNAME: "localhost", NODE_ENV: "production" });
                        // サーバープロセスをフォーク
                        serverProcess = (0, child_process_1.fork)(serverPath, [], {
                            env: env,
                            stdio: ["pipe", "pipe", "pipe", "ipc"],
                        });
                        (_a = serverProcess.stdout) === null || _a === void 0 ? void 0 : _a.on("data", function (data) {
                            (0, utils_1.debugLog)("[Next.js Server] ".concat(data.toString()));
                        });
                        (_b = serverProcess.stderr) === null || _b === void 0 ? void 0 : _b.on("data", function (data) {
                            console.error("[Next.js Server Error] ".concat(data.toString()));
                        });
                        serverProcess.on("error", function (error) {
                            console.error("Failed to start Next.js server:", error);
                            reject(error);
                        });
                        // サーバーが起動するまで待機
                        waitForServer(port)
                            .then(function () {
                            (0, utils_1.debugLog)("Next.js server is ready on port ".concat(port));
                            resolve(port);
                        })
                            .catch(reject);
                    });
                })];
        });
    });
}
/**
 * 利用可能なポートを探す
 */
function findAvailablePort(startPort) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve) {
                    var server = http.createServer();
                    server.listen(startPort, function () {
                        var port = server.address().port;
                        server.close(function () { return resolve(port); });
                    });
                    server.on("error", function () {
                        // ポートが使用中の場合、次のポートを試す
                        resolve(findAvailablePort(startPort + 1));
                    });
                })];
        });
    });
}
/**
 * サーバーが起動するまで待機
 */
function waitForServer(port_1) {
    return __awaiter(this, arguments, void 0, function (port, maxAttempts) {
        var i, _a;
        if (maxAttempts === void 0) { maxAttempts = 30; }
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    i = 0;
                    _b.label = 1;
                case 1:
                    if (!(i < maxAttempts)) return [3 /*break*/, 7];
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 4, , 6]);
                    return [4 /*yield*/, checkServerReady(port)];
                case 3:
                    _b.sent();
                    return [2 /*return*/];
                case 4:
                    _a = _b.sent();
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 500); })];
                case 5:
                    _b.sent();
                    return [3 /*break*/, 6];
                case 6:
                    i++;
                    return [3 /*break*/, 1];
                case 7: throw new Error("Server did not start in time");
            }
        });
    });
}
/**
 * サーバーの準備状態をチェック
 */
function checkServerReady(port) {
    return new Promise(function (resolve, reject) {
        var req = http.get("http://localhost:".concat(port, "/"), function (res) {
            // 200, 304 (Not Modified), 302/303 (リダイレクト) は全てサーバー起動成功と見なす
            var successCodes = [200, 304, 302, 303, 307, 308];
            if (res.statusCode && successCodes.includes(res.statusCode)) {
                resolve();
            }
            else {
                reject(new Error("Status: ".concat(res.statusCode)));
            }
        });
        req.on("error", reject);
        req.setTimeout(1000, function () {
            req.destroy();
            reject(new Error("Timeout"));
        });
    });
}
/**
 * サーバーを停止する
 */
function stopNextServer() {
    if (serverProcess) {
        (0, utils_1.debugLog)("Stopping Next.js server...");
        serverProcess.kill();
        serverProcess = null;
    }
}
/**
 * 現在のサーバーポートを取得
 */
function getServerPort() {
    return serverPort;
}
//# sourceMappingURL=server.js.map