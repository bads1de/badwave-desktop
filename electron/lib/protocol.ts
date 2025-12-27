import { protocol } from "electron";
import * as url from "url";

// プロトコルハンドラーの登録
export function registerProtocolHandlers() {
  // appプロトコルのハンドラー
  registerAppProtocol();
}

// appプロトコルのハンドラーを登録
function registerAppProtocol() {
  protocol.registerFileProtocol(
    "app",
    (
      request: Electron.ProtocolRequest,
      callback: (response: string) => void
    ) => {
      const filePath = url.fileURLToPath(
        "file://" + request.url.slice("app://".length)
      );
      callback(filePath);
    }
  );
}
