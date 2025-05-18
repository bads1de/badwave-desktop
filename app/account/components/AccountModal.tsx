"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { createClient } from "@/libs/supabase/client";
import Image from "next/image";
import Modal from "@/components/Modals/Modal";
import { Camera, User, Lock } from "lucide-react";
import useUpdateUserProfileMutation from "@/hooks/data/useUpdateUserProfileMutation";

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    full_name?: string;
    avatar_url?: string;
  } | null;
}

const AccountModal = ({ isOpen, onClose, user }: AccountModalProps) => {
  const supabaseClient = createClient();
  const [newFullName, setNewFullName] = useState(user?.full_name || "");
  const [currentAvatar, setCurrentAvatar] = useState(user?.avatar_url);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordAuthUser, setIsPasswordAuthUser] = useState(false);

  // TanStack Queryを使用したミューテーション
  const { updateProfile, updateAvatar, updatePassword } =
    useUpdateUserProfileMutation({ onClose });

  // ローディング状態を取得
  const isLoading =
    updateProfile.isPending ||
    updateAvatar.isPending ||
    updatePassword.isPending;

  useEffect(() => {
    // ユーザーの認証プロバイダーを確認する関数
    const checkAuthProvider = async () => {
      // 現在のセッション情報を取得
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();
      // プロバイダーがパスワード認証の場合のみtrue
      setIsPasswordAuthUser(session?.user?.app_metadata?.provider === "email");
    };

    // コンポーネントマウント時に認証プロバイダーを確認
    checkAuthProvider();
  }, [supabaseClient]);

  // プロフィール情報更新処理
  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!user?.id) return;

    // TanStack Queryのミューテーションを使用
    updateProfile.mutate({
      userId: user.id,
      fullName: newFullName,
    });
  };

  // アバター画像変更処理
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    // TanStack Queryのミューテーションを使用
    updateAvatar.mutate(
      {
        userId: user.id,
        avatarFile: file,
        currentAvatarUrl: currentAvatar,
      },
      {
        onSuccess: ({ avatarUrl }) => {
          // 成功時に現在のアバターを更新
          setCurrentAvatar(avatarUrl);
        },
      }
    );
  };

  // パスワード更新処理
  const handlePasswordUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // パスワードの一致確認
    if (newPassword !== confirmPassword) {
      toast.error("パスワードが一致しません");
      return;
    }

    // TanStack Queryのミューテーションを使用
    updatePassword.mutate(
      {
        newPassword,
      },
      {
        onSuccess: () => {
          // 成功時に入力をリセット
          setNewPassword("");
          setConfirmPassword("");
        },
      }
    );
  };

  return (
    <Modal
      title="プロフィール編集"
      description="プロフィール情報を編集できます"
      isOpen={isOpen}
      onChange={onClose}
    >
      <div className="space-y-8">
        {/* アバターセクション */}
        <div className="flex justify-center">
          <div className="relative w-28 h-28 group">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-900/20 animate-pulse" />
            <Image
              src={currentAvatar || "/images/default-avatar.png"}
              alt="Profile"
              fill
              className="rounded-full object-cover border-4 border-neutral-800/50 group-hover:border-purple-500/50 transition-all duration-300"
            />
            <label className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-all duration-300 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-2">
                <Camera className="w-6 h-6 text-purple-400" />
                <span className="text-white text-sm font-medium">
                  画像を変更
                </span>
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
                disabled={isLoading}
              />
            </label>
          </div>
        </div>

        {/* プロフィール編集フォーム */}
        <form onSubmit={handleUpdateProfile} className="space-y-6">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-neutral-400">
              <User className="w-4 h-4" />
              ユーザー名
            </label>
            <input
              type="text"
              value={newFullName}
              onChange={(e) => setNewFullName(e.target.value)}
              className="w-full px-4 py-3 bg-neutral-900/60 border border-white/[0.02] rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/30 transition-all duration-300"
              placeholder="ユーザー名を入力"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-gradient-to-br from-purple-500/20 to-purple-900/20 hover:from-purple-500/30 hover:to-purple-900/30 border border-purple-500/30 hover:border-purple-500/50 rounded-xl text-white font-medium transition-all duration-300 disabled:opacity-50"
          >
            プロフィールを更新
          </button>
        </form>

        {/* パスワード変更フォーム */}
        {isPasswordAuthUser && (
          <form
            onSubmit={handlePasswordUpdate}
            className="space-y-6 pt-6 border-t border-white/[0.02]"
            data-testid="password-form"
          >
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-sm font-medium text-neutral-400">
                <Lock className="w-4 h-4" />
                パスワード変更
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-900/60 border border-white/[0.02] rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/30 transition-all duration-300"
                placeholder="新しいパスワード"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-900/60 border border-white/[0.02] rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/30 transition-all duration-300"
                placeholder="パスワードの確認"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-neutral-900/60 border border-white/[0.02] hover:border-purple-500/30 rounded-xl text-white font-medium transition-all duration-300 disabled:opacity-50"
            >
              パスワードを更新
            </button>
          </form>
        )}
      </div>
    </Modal>
  );
};

export default AccountModal;
