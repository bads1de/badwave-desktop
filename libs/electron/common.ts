/**
 * 現在の実行環境がElectronかどうかを判定
 *
 * 注意: Next.jsのSSRとCSRの間でハイドレーションエラーを防ぐため、
 * サーバーサイドでは常にfalseを返し、クライアントサイドでのみ実際の判定を行います。
 */
export const isElectron = (): boolean => {
  // サーバーサイドレンダリング時は常にfalseを返す
  if (typeof window === "undefined") {
    return false;
  }

  // クライアントサイドでのみElectronの存在を確認
  if (typeof (window as any).electron !== "undefined") {
    return (window as any).electron.appInfo.isElectron;
  }

  return false;
};

/**
 * アプリケーションのバージョンを取得
 *
 * 注意: Next.jsのSSRとCSRの間でハイドレーションエラーを防ぐため、
 * サーバーサイドでは常にデフォルト値を返し、クライアントサイドでのみ実際の判定を行います。
 */
export const getAppVersion = (): string => {
  // サーバーサイドレンダリング時は常にデフォルト値を返す
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_APP_VERSION || "0.0.0";
  }

  // クライアントサイドでElectronが利用可能な場合はバージョン情報を取得
  if (typeof (window as any).electron !== "undefined") {
    return (window as any).electron.appInfo.getVersion();
  }

  return process.env.NEXT_PUBLIC_APP_VERSION || "0.0.0";
};

/**
 * 実行プラットフォームを取得
 *
 * 注意: Next.jsのSSRとCSRの間でハイドレーションエラーを防ぐため、
 * サーバーサイドでは常に"web"を返し、クライアントサイドでのみ実際の判定を行います。
 */
export const getPlatform = (): string => {
  // サーバーサイドレンダリング時は常に"web"を返す
  if (typeof window === "undefined") {
    return "web";
  }

  // クライアントサイドでElectronが利用可能な場合はプラットフォーム情報を取得
  if (typeof (window as any).electron !== "undefined") {
    return (window as any).electron.appInfo.platform;
  }

  return "web";
};

/**
 * ネットワークエラーかどうかを判定するヘルパー関数
 * @param error エラーオブジェクト
 * @returns ネットワークエラーかどうか
 */
export const isNetworkError = (error: any): boolean => {
  if (!error) return false;

  const errorMessage = error.message || error.toString();
  const networkErrorPatterns = [
    "Failed to fetch",
    "NetworkError",
    "Network request failed",
    "fetch failed",
    "net::ERR_",
    "ENOTFOUND",
    "ECONNREFUSED",
    "ETIMEDOUT",
    "ERR_NETWORK",
  ];

  return networkErrorPatterns.some((pattern) =>
    errorMessage.toLowerCase().includes(pattern.toLowerCase())
  );
};
