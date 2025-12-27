import { createClient } from "@/libs/supabase/server";

/**
 * 環境変数から管理者ユーザーIDのリストを取得する関数。
 * ADMIN_USER_IDS 環境変数にカンマ区切りでユーザーIDを設定できます。
 *
 * @returns {string[]} 管理者ユーザーIDの配列
 */
export const getAdminUserIds = (): string[] => {
  const adminIds = process.env.ADMIN_USER_IDS;

  if (!adminIds) {
    return [];
  }

  return adminIds.split(",").map((id) => id.trim());
};

/**
 * 指定されたユーザーIDが管理者かどうかを確認する関数。
 *
 * @param {string} userId - 確認するユーザーID
 * @returns {boolean} 管理者の場合はtrue、そうでない場合はfalse
 */
export const isAdmin = (userId: string): boolean => {
  const adminIds = getAdminUserIds();
  return adminIds.includes(userId);
};

/**
 * 現在ログイン中のユーザーが管理者かどうかを確認する関数。
 * サーバーサイドでのみ使用可能です。
 *
 * @returns {Promise<boolean>} 管理者の場合はtrue、そうでない場合はfalse
 */
export const isCurrentUserAdmin = async (): Promise<boolean> => {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return false;
    }

    return isAdmin(user.id);
  } catch {
    return false;
  }
};

/**
 * 管理者権限を要求する関数。
 * 管理者でない場合はエラーをスローします。
 *
 * @throws {Error} 管理者でない場合にエラーをスロー
 */
export const requireAdmin = async (): Promise<void> => {
  const isAdminUser = await isCurrentUserAdmin();
  if (!isAdminUser) {
    throw new Error("管理者権限が必要です");
  }
};
