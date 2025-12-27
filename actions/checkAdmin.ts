"use server";

import { isCurrentUserAdmin } from "@/libs/admin";

/**
 * 現在のユーザーが管理者かどうかをチェックするServer Action
 *
 * @returns {Promise<{ isAdmin: boolean }>} 管理者の場合はtrue
 */
export async function checkIsAdmin(): Promise<{ isAdmin: boolean }> {
  const isAdmin = await isCurrentUserAdmin();
  return { isAdmin };
}
