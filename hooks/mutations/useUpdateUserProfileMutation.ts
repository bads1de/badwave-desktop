"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { createClient } from "@/libs/supabase/client";
import { uploadFileToR2, deleteFileFromR2 } from "@/actions/r2";
import { checkIsAdmin } from "@/actions/checkAdmin";
import { CACHED_QUERIES } from "@/constants";

interface UpdateProfileParams {
  userId: string;
  fullName: string;
}

interface UpdateAvatarParams {
  userId: string;
  avatarFile: File;
  currentAvatarUrl?: string;
}

interface UpdatePasswordParams {
  newPassword: string;
}

interface AccountModalHook {
  onClose: () => void;
}

/**
 * ユーザープロフィールの更新処理を行うカスタムフック
 *
 * @param accountModal アカウントモーダルのフック
 * @returns 更新ミューテーション
 */
const useUpdateUserProfileMutation = (accountModal: AccountModalHook) => {
  const supabaseClient = createClient();
  const queryClient = useQueryClient();
  const router = useRouter();

  /**
   * プロフィール情報を更新するミューテーション
   */
  const updateProfile = useMutation({
    mutationFn: async ({ userId, fullName }: UpdateProfileParams) => {
      if (!userId) {
        toast.error("ユーザーIDが必要です");
        throw new Error("ユーザーIDが必要です");
      }

      // プロフィール名を更新
      const { error } = await supabaseClient
        .from("users")
        .update({ full_name: fullName })
        .eq("id", userId);

      if (error) {
        toast.error(error.message);
        throw error;
      }

      return { userId, fullName };
    },
    onSuccess: () => {
      // キャッシュを無効化
      queryClient.invalidateQueries({ queryKey: [CACHED_QUERIES.userDetails] });

      // UIを更新
      router.refresh();
      toast.success("プロフィールを更新しました");

      // モーダルを閉じる
      accountModal.onClose();
    },
    onError: (error: Error) => {
      console.error("Update profile error:", error);
      toast.error("プロフィールの更新に失敗しました");
    },
  });

  /**
   * アバター画像を更新するミューテーション
   */
  const updateAvatar = useMutation({
    mutationFn: async ({
      userId,
      avatarFile,
      currentAvatarUrl,
    }: UpdateAvatarParams) => {
      // 管理者権限チェック (アバターのアップロードも管理者に限定)
      const { isAdmin } = await checkIsAdmin();

      if (!isAdmin) {
        toast.error("管理者権限が必要です");
        throw new Error("管理者権限が必要です");
      }

      if (!userId || !avatarFile) {
        toast.error("ユーザーIDと画像が必要です");
        throw new Error("ユーザーIDと画像が必要です");
      }

      // 既存のアバター画像がある場合は削除する
      if (currentAvatarUrl) {
        try {
          // 画像のファイルパスを取得
          const filePath = currentAvatarUrl.split("/").pop();

          // R2ストレージから既存画像を削除
          const deleteResult = await deleteFileFromR2("image", filePath!);
          if (!deleteResult.success) {
            console.error("画像の削除に失敗しました", deleteResult.error);
          }
        } catch (error) {
          console.error("画像の削除に失敗しました", error);
          // 削除に失敗しても続行
        }
      }

      // 新しいアバター画像をアップロードする
      const formData = new FormData();
      formData.append("file", avatarFile);
      formData.append("bucketName", "image");
      formData.append("fileNamePrefix", `avatar-${userId}`);

      const result = await uploadFileToR2(formData);

      if (!result.success || !result.url) {
        toast.error(result.error || "アップロードに失敗しました");
        throw new Error(result.error || "アップロードに失敗しました");
      }

      const avatarUrl = result.url;

      // データベースのユーザー情報を更新する
      const { error } = await supabaseClient
        .from("users")
        .update({ avatar_url: avatarUrl })
        .eq("id", userId);

      if (error) {
        toast.error(error.message);
        throw error;
      }

      return { userId, avatarUrl };
    },
    onSuccess: () => {
      // キャッシュを無効化
      queryClient.invalidateQueries({ queryKey: [CACHED_QUERIES.userDetails] });

      // UIを更新
      router.refresh();
      toast.success("アバターを更新しました");
    },
    onError: (error: Error) => {
      console.error("Update avatar error:", error);
      toast.error(error.message || "アバターの更新に失敗しました");
    },
  });

  /**
   * パスワードを更新するミューテーション
   */
  const updatePassword = useMutation({
    mutationFn: async ({ newPassword }: UpdatePasswordParams) => {
      if (!newPassword || newPassword.length < 8) {
        toast.error("パスワードは8文字以上で入力してください");
        throw new Error("パスワードは8文字以上で入力してください");
      }

      // Supabaseの認証APIでパスワードを更新
      const { error } = await supabaseClient.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        toast.error(error.message);
        throw error;
      }

      return { success: true };
    },
    onSuccess: () => {
      // 成功メッセージを表示
      toast.success("パスワードを更新しました");

      // モーダルを閉じる
      accountModal.onClose();
    },
    onError: (error: Error) => {
      console.error("Update password error:", error);
      toast.error("パスワードの更新に失敗しました");
    },
  });

  return {
    updateProfile,
    updateAvatar,
    updatePassword,
  };
};

export default useUpdateUserProfileMutation;
