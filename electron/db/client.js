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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDb = void 0;
var better_sqlite3_1 = __importDefault(require("better-sqlite3"));
var better_sqlite3_2 = require("drizzle-orm/better-sqlite3");
var electron_1 = require("electron");
var path_1 = __importDefault(require("path"));
var schema = __importStar(require("./schema"));
var dbInstance = null;
var getDb = function () {
    if (dbInstance)
        return dbInstance;
    // Ensure we are in the main process
    if (!electron_1.app) {
        throw new Error("Local Database can only be initialized in the Electron Main process.");
    }
    var dbPath = path_1.default.join(electron_1.app.getPath("userData"), "badwave_offline.db");
    // Initialize SQLite
    // verbose: console.log can be useful for debugging
    var sqlite = new better_sqlite3_1.default(dbPath, { verbose: console.log });
    // Initialize Drizzle
    dbInstance = (0, better_sqlite3_2.drizzle)(sqlite, { schema: schema });
    return dbInstance;
};
exports.getDb = getDb;
//# sourceMappingURL=client.js.map