import { CHANNELS } from "../channels";
import { ipcMain, app } from "electron";
import { spawn } from "child_process";
import * as path from "path";
import * as fs from "fs";
import * as https from "https";
import * as http from "http";
import { z } from "zod";
import { validateInput } from "../lib/ipc-validate";
import { debugLog } from "../utils";

const audioPathSchema = z.string().min(1).max(2048);
const lyricsTextSchema = z.string().max(50000);

/**
 * トランスクライブ関連のIPCハンドラーをセットアップする
 */
export function setupTranscriptionHandlers() {
  /**
   * LRC生成リクエスト
   * @param audioPath 音声ファイルのパス（ローカルまたはURL）
   * @param lyricsText 歌詞テキスト
   */
  ipcMain.handle(
    CHANNELS.GENERATE_LRC,
    async (_event, rawAudioPath: string, rawLyricsText: string) => {
      return new Promise((resolve) => {
        // 入力検証: 長さ制限と基本型チェック
        let audioPath: string;
        let lyricsText: string;
        try {
          audioPath = validateInput(
            audioPathSchema,
            rawAudioPath,
            "transcribe:generate-lrc:audioPath",
          );
          lyricsText = validateInput(
            lyricsTextSchema,
            rawLyricsText,
            "transcribe:generate-lrc:lyricsText",
          );
        } catch (validationError) {
          // バリデーション失敗は例外ではなく、クライアントが期待する
          // { status: "error", message } 形式で返す
          resolve({
            status: "error",
            message:
              validationError instanceof Error
                ? validationError.message
                : "Invalid input",
          });
          return;
        }
        // Python環境のパス解決
        const isDev = !app.isPackaged;
        let pythonPath = "";
        let scriptPath = "";

        if (isDev) {
          // 開発時: python/venv を使用
          const rootDir = path.join(__dirname, "../..");
          pythonPath = path.join(
            rootDir,
            "python",
            "venv",
            "Scripts",
            "python.exe",
          );
          scriptPath = path.join(rootDir, "python", "lrc_generator.py");
        } else {
          // 本番時: resources/python を使用 (Embedded Python)
          pythonPath = path.join(process.resourcesPath, "python", "python.exe");
          scriptPath = path.join(
            process.resourcesPath,
            "python",
            "lrc_generator.py",
          );
        }

        debugLog(`[Transcribe] Request - Path: ${audioPath}`);

        // Python実行環境の存在確認
        if (!fs.existsSync(pythonPath)) {
          return resolve({
            status: "error",
            message: `Python実行環境が見つかりません: ${pythonPath}`,
          });
        }

        // Python実行コア
        const runPython = (targetPath: string, isTemp: boolean = false) => {
          debugLog(`[Transcribe] Executing Python with: ${targetPath}`);
          const pythonProcess = spawn(pythonPath, [
            scriptPath,
            targetPath,
            lyricsText,
          ]);

          let stdout = "";
          let stderr = "";

          pythonProcess.stdout.on("data", (data) => {
            stdout += data.toString();
          });
          pythonProcess.stderr.on("data", (data) => {
            stderr += data.toString();
          });

          pythonProcess.on("close", (code) => {
            if (isTemp && fs.existsSync(targetPath)) {
              fs.unlink(targetPath, () => {});
            }

            if (code !== 0) {
              console.error(
                `[Transcribe] Python Error (code ${code}): ${stderr}`,
              );
              return resolve({
                status: "error",
                message: `トランスクライブエンジンの実行に失敗しました`,
              });
            }

            try {
              const result = JSON.parse(stdout.trim());
              resolve(result);
            } catch (e) {
              console.error(`[Transcribe] JSON Parse Error: ${stdout}`);
              resolve({
                status: "error",
                message: "トランスクライブエンジンの出力解析に失敗しました",
              });
            }
          });
        };

        // パス判定と処理開始
        const isUrl =
          audioPath.startsWith("http://") || audioPath.startsWith("https://");

        if (isUrl) {
          debugLog(`[Transcribe] Remote URL detected. Downloading...`);
          const tempPath = path.join(
            app.getPath("temp"),
            `badwave_transcribe_${Date.now()}.mp3`,
          );
          const file = fs.createWriteStream(tempPath);
          const client = audioPath.startsWith("https") ? https : http;

          const request = client.get(audioPath, (response) => {
            if (response.statusCode !== 200) {
              file.close();
              fs.unlink(tempPath, () => {});
              return resolve({
                status: "error",
                message: `ファイルの取得に失敗しました(HTTP ${response.statusCode})`,
              });
            }
            response.pipe(file);
            file.on("finish", () => {
              file.close(() => runPython(tempPath, true));
            });
          });

          request.on("error", (err) => {
            file.close();
            if (fs.existsSync(tempPath)) fs.unlink(tempPath, () => {});
            resolve({ status: "error", message: `通信エラー: ${err.message}` });
          });
        } else {
          debugLog(`[Transcribe] Local path detected.`);

          // 安全なパスと拡張子のチェック
          const ALLOWED_EXTENSIONS = new Set([
            ".mp3", ".wav", ".flac", ".aac", ".ogg", ".opus", ".m4a", ".wma",
            ".alac", ".aiff", ".webm", ".mp4", ".m4v", ".avi", ".mkv",
          ]);
          const normalized = path.normalize(audioPath);
          const ext = path.extname(normalized).toLowerCase();

          if (
            audioPath.includes("..") ||
            normalized.includes("..") ||
            /(\/|\\)\.\.(\/|\\|$)/.test(audioPath) ||
            !ALLOWED_EXTENSIONS.has(ext)
          ) {
            throw new Error("Invalid path or unsupported file extension");
          }

          runPython(audioPath, false);
        }
      });
    },
  );
}
