import { app } from "electron";
import * as path from "path";
import * as http from "http";
import { ChildProcess, fork } from "child_process";
import { debugLog } from "../utils";

let serverProcess: ChildProcess | null = null;
let serverPort = 3000;

/**
 * Next.js Standaloneサーバーを起動する
 * 本番モードでのみ使用される
 */
export async function startNextServer(): Promise<number> {
  return new Promise((resolve, reject) => {
    // Standaloneサーバーのパスを構築
    // パッケージ化後: resources/standalone/server.js
    const serverPath = app.isPackaged
      ? path.join(process.resourcesPath, "standalone", "server.js")
      : path.join(app.getAppPath(), ".next", "standalone", "server.js");

    debugLog(`Starting Next.js server from: ${serverPath}`);

    // 空きポートを探す
    // 開発者がよく使う3000番台を避けて 13000 から開始する
    findAvailablePort(13000).then((port) => {
      serverPort = port;

      // 環境変数を設定
      const env = {
        ...process.env,
        PORT: String(port),
        HOSTNAME: "localhost",
        NODE_ENV: "production" as const,
      };

      // サーバープロセスをフォーク
      serverProcess = fork(serverPath, [], {
        env,
        stdio: ["pipe", "pipe", "pipe", "ipc"],
      });

      serverProcess.stdout?.on("data", (data) => {
        debugLog(`[Next.js Server] ${data.toString()}`);
      });

      serverProcess.stderr?.on("data", (data) => {
        console.error(`[Next.js Server Error] ${data.toString()}`);
      });

      serverProcess.on("error", (error) => {
        console.error("Failed to start Next.js server:", error);
        reject(error);
      });

      // サーバーが起動するまで待機
      waitForServer(port)
        .then(() => {
          debugLog(`Next.js server is ready on port ${port}`);
          resolve(port);
        })
        .catch(reject);
    });
  });
}

/**
 * 利用可能なポートを探す
 */
async function findAvailablePort(startPort: number): Promise<number> {
  return new Promise((resolve) => {
    const server = http.createServer();
    server.listen(startPort, () => {
      const port = (server.address() as any).port;
      server.close(() => resolve(port));
    });
    server.on("error", () => {
      // ポートが使用中の場合、次のポートを試す
      resolve(findAvailablePort(startPort + 1));
    });
  });
}

/**
 * サーバーが起動するまで待機
 */
async function waitForServer(port: number, maxAttempts = 30): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await checkServerReady(port);
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  throw new Error("Server did not start in time");
}

/**
 * サーバーの準備状態をチェック
 */
function checkServerReady(port: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://localhost:${port}/`, (res) => {
      // 200, 304 (Not Modified), 302/303 (リダイレクト) は全てサーバー起動成功と見なす
      const successCodes = [200, 304, 302, 303, 307, 308];
      if (res.statusCode && successCodes.includes(res.statusCode)) {
        resolve();
      } else {
        reject(new Error(`Status: ${res.statusCode}`));
      }
    });
    req.on("error", reject);
    req.setTimeout(1000, () => {
      req.destroy();
      reject(new Error("Timeout"));
    });
  });
}

/**
 * サーバーを停止する
 */
export function stopNextServer(): void {
  if (serverProcess) {
    debugLog("Stopping Next.js server...");
    serverProcess.kill();
    serverProcess = null;
  }
}

/**
 * 現在のサーバーポートを取得
 */
export function getServerPort(): number {
  return serverPort;
}
