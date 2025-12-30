import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getRandomColor = () => {
  const colors = [
    "#00ff87",
    "#60efff",
    "#0061ff",
    "#ff00a0",
    "#ff1700",
    "#fff700",
    "#a6ff00",
    "#00ffa3",
    "#00ffff",
    "#ff00ff",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

export const splitTags = (tagString?: string): string[] => {
  return (
    tagString
      ?.split(/\s*,\s*/)
      .map((tag) => tag.trim())
      .filter(Boolean) || []
  );
};

/**
 * 文字列をサニタイズする関数。
 * 英数字、ハイフン(-)、アンダースコア(_)以外の文字が含まれている場合は、ランダムな文字列を生成して返す。
 *
 * @param {string} title - サニタイズする文字列
 * @returns {string} サニタイズされた文字列、またはランダムに生成された文字列
 */
export const sanitizeTitle = (title: string) => {
  const regex = /^[a-zA-Z0-9-_]+$/;

  if (!regex.test(title)) {
    return generateRandomString(10);
  }

  return title;
};

/**
 * 指定された長さのランダムな文字列を生成するヘルパー関数。
 *
 * @param {number} length - 生成する文字列の長さ
 * @returns {string} 生成されたランダムな文字列
 */
export const generateRandomString = (length: number): string => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return result;
};

/**
 * 秒数を「分:秒」の形式にフォーマットする関数。
 *
 * @param {number} seconds - フォーマットする秒数
 * @returns {string} フォーマットされた時間文字列 (例: "3:25")
 */
export const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
};

/**
 * URLからファイルをダウンロードする関数。
 *
 * @async
 * @param {string} url - ダウンロードするファイルのURL
 * @param {string} filename - 保存するファイル名
 * @returns {Promise<void>} ファイルのダウンロードが完了したら解決されるPromise
 * @throws {Error} ダウンロード中にエラーが発生した場合、エラーをスローする。
 */
export const downloadFile = async (url: string, filename: string) => {
  try {
    const response = await fetch(url, {
      mode: "cors",
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const blob = await response.blob();
    const blobURL = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = blobURL;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobURL);
  } catch (error) {
    console.error("ダウンロードに失敗しました:", error);
  }
};
