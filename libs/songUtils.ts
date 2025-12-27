import { Song } from "@/types";

/**
 * 曲がローカルファイルかどうかを判定する
 *
 * @param song - 判定する曲オブジェクト
 * @returns ローカルファイルの場合true
 */
export function isLocalSong(song: Song | null | undefined): boolean {
  if (!song || !song.song_path) {
    return false;
  }

  // HTTPまたはHTTPSで始まる場合はオンライン曲
  if (
    song.song_path.startsWith("http://") ||
    song.song_path.startsWith("https://")
  ) {
    return false;
  }

  // file://で始まる場合はローカルファイル
  if (song.song_path.startsWith("file://")) {
    return true;
  }

  // ローカルファイルパス（Windows: C:\, Unix: /）の場合
  const isWindowsPath = /^[A-Za-z]:\\/.test(song.song_path);
  const isUnixPath = song.song_path.startsWith("/");

  return isWindowsPath || isUnixPath;
}

/**
 * ローカルファイルパスをfile://スキーマ付きのURLに変換する
 *
 * @param filePath - ローカルファイルパス
 * @returns file://スキーマ付きのURL
 */
export function toFileUrl(filePath: string): string {
  if (filePath.startsWith("file://")) {
    return filePath;
  }

  // Windowsパスの場合
  if (/^[A-Za-z]:\\/.test(filePath)) {
    return `file:///${filePath.replace(/\\/g, "/")}`;
  }

  // Unixパスの場合
  if (filePath.startsWith("/")) {
    return `file://${filePath}`;
  }

  return filePath;
}

/**
 * ローカル曲用のIDを生成する
 *
 * @param filePath - ファイルパス
 * @returns ローカル曲用のID
 */
export function generateLocalSongId(filePath: string): string {
  // ファイルパスをBase64エンコードしてプレフィックスを付ける
  const encoded = btoa(encodeURIComponent(filePath));
  return `local_${encoded}`;
}

/**
 * ローカル曲のIDからファイルパスを復元する
 *
 * @param localId - ローカル曲のID
 * @returns ファイルパス
 */
export function extractFilePathFromLocalId(localId: string): string | null {
  if (!localId.startsWith("local_")) {
    return null;
  }

  try {
    const encoded = localId.substring(6); // 'local_'を除去
    const decoded = atob(encoded);
    return decodeURIComponent(decoded);
  } catch (error) {
    console.error("Failed to decode local song ID:", error);
    return null;
  }
}

/**
 * ダウンロード用のファイル名を生成する
 *
 * @param song - 曲オブジェクト
 * @returns ファイルファイル名 (例: Title-ID.mp3)
 */
export function getDownloadFilename(song: Song): string {
  // ファイルシステムで使用できない文字を置換
  const safeTitle = song.title.replace(/[<>:"/\\|?*]/g, "");
  return `${safeTitle}-${song.id}.mp3`;
}
