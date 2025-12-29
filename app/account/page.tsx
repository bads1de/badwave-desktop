"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import Image from "next/image";
import { Camera, User, Lock } from "lucide-react";
import { HiCheck } from "react-icons/hi";
import { motion } from "framer-motion";

import { createClient } from "@/libs/supabase/client";
import { useUser } from "@/hooks/auth/useUser";
import useUpdateUserProfileMutation from "@/hooks/mutations/useUpdateUserProfileMutation";
import { colorSchemes } from "@/constants/colorSchemes";
import useColorSchemeStore from "@/hooks/stores/useColorSchemeStore";
import useGetTopPlayedSongs from "@/hooks/data/useGetTopPlayedSongs";
import useOnPlay from "@/hooks/player/useOnPlay";
import Modal from "@/components/Modals/Modal";

// 1. AccountModal
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

  const { updateProfile, updateAvatar, updatePassword } =
    useUpdateUserProfileMutation({ onClose });

  const isLoading =
    updateProfile.isPending ||
    updateAvatar.isPending ||
    updatePassword.isPending;

  useEffect(() => {
    const checkAuthProvider = async () => {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();
      setIsPasswordAuthUser(session?.user?.app_metadata?.provider === "email");
    };
    checkAuthProvider();
  }, [supabaseClient]);

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user?.id) return;
    updateProfile.mutate({
      userId: user.id,
      fullName: newFullName,
    });
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    updateAvatar.mutate(
      {
        userId: user.id,
        avatarFile: file,
        currentAvatarUrl: currentAvatar,
      },
      {
        onSuccess: ({ avatarUrl }) => {
          setCurrentAvatar(avatarUrl);
        },
      }
    );
  };

  const handlePasswordUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("パスワードが一致しません");
      return;
    }
    updatePassword.mutate(
      { newPassword },
      {
        onSuccess: () => {
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
        <div className="flex justify-center">
          <div className="relative w-28 h-28 group">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-theme-500/20 to-theme-900/20 animate-pulse" />
            <Image
              src={currentAvatar || "/images/default-avatar.png"}
              alt="Profile"
              fill
              className="rounded-full object-cover border-4 border-neutral-800/50 group-hover:border-theme-500/50 transition-all duration-300"
            />
            <label className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-all duration-300 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-2">
                <Camera className="w-6 h-6 text-theme-400" />
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
              className="w-full px-4 py-3 bg-neutral-900/60 border border-white/[0.02] rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-theme-500/20 focus:border-theme-500/30 transition-all duration-300"
              placeholder="ユーザー名を入力"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-gradient-to-br from-theme-500/20 to-theme-900/20 hover:from-theme-500/30 hover:to-theme-900/30 border border-theme-500/30 hover:border-theme-500/50 rounded-xl text-white font-medium transition-all duration-300 disabled:opacity-50"
          >
            プロフィールを更新
          </button>
        </form>

        {isPasswordAuthUser && (
          <form
            onSubmit={handlePasswordUpdate}
            className="space-y-6 pt-6 border-t border-white/[0.02]"
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
                className="w-full px-4 py-3 bg-neutral-900/60 border border-white/[0.02] rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-theme-500/20 focus:border-theme-500/30 transition-all duration-300"
                placeholder="新しいパスワード"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-900/60 border border-white/[0.02] rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-theme-500/20 focus:border-theme-500/30 transition-all duration-300"
                placeholder="パスワードの確認"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-neutral-900/60 border border-white/[0.02] hover:border-theme-500/30 rounded-xl text-white font-medium transition-all duration-300 disabled:opacity-50"
            >
              パスワードを更新
            </button>
          </form>
        )}
      </div>
    </Modal>
  );
};

// 2. ColorSchemeSelector
const ColorSchemeSelector = () => {
  const { colorSchemeId, setColorScheme } = useColorSchemeStore();

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-neutral-900/80 via-neutral-800/20 to-neutral-900/80 backdrop-blur-xl border border-white/[0.05] shadow-lg rounded-2xl p-8">
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-[var(--accent-from)]/10 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-[var(--accent-to)]/10 rounded-full blur-3xl"></div>

      <div className="relative">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-white mb-2">カラースキーム</h3>
          <p className="text-sm text-neutral-400">
            アプリ全体の配色を変更します
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {colorSchemes.map((scheme) => {
            const isSelected = colorSchemeId === scheme.id;
            return (
              <motion.button
                key={scheme.id}
                onClick={() => setColorScheme(scheme.id)}
                className={`
                  relative overflow-hidden rounded-xl p-4 text-left transition-all duration-300
                  ${
                    isSelected
                      ? "ring-2 ring-white/50 bg-white/10"
                      : "bg-neutral-800/50 hover:bg-neutral-700/50 border border-white/5"
                  }
                `}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div
                  className="w-full h-16 rounded-lg mb-3 shadow-inner"
                  style={{ background: scheme.previewGradient }}
                />
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-white text-sm">
                      {scheme.name}
                    </h4>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {scheme.description}
                    </p>
                  </div>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center justify-center w-6 h-6 rounded-full bg-white"
                    >
                      <HiCheck className="w-4 h-4 text-neutral-900" />
                    </motion.div>
                  )}
                </div>
                <div
                  className="absolute inset-0 opacity-0 hover:opacity-10 transition-opacity duration-300 pointer-events-none"
                  style={{ background: scheme.previewGradient }}
                />
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// 3. TopPlayedSongs
const PERIODS = [
  { value: "day", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "all", label: "All Time" },
] as const;

const TopPlayedSongs = memo(({ user }: { user: any }) => {
  const [period, setPeriod] =
    useState<(typeof PERIODS)[number]["value"]>("day");
  const { topSongs, isLoading } = useGetTopPlayedSongs(user?.id, period);
  const onPlay = useOnPlay(topSongs || []);

  const handlePlay = useCallback(
    (id: string) => {
      onPlay(id);
    },
    [onPlay]
  );

  return (
    <div className="bg-neutral-900/40 backdrop-blur-xl border border-white/[0.02] shadow-inner rounded-xl p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h3 className="text-xl md:text-2xl font-bold text-white">
          再生ランキング
        </h3>
        <div className="w-full md:w-auto overflow-x-auto scrollbar-hide">
          <div className="inline-flex h-10 items-center justify-start md:justify-center rounded-xl bg-neutral-800/50 backdrop-blur-xl border border-white/[0.02] p-1">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`
                  inline-flex items-center justify-center whitespace-nowrap rounded-lg
                  px-2 md:px-3 py-1 md:py-1.5 text-xs md:text-sm font-medium
                  transition-all duration-300
                  focus-visible:outline-none focus-visible:ring-2
                  focus-visible:ring-theme-500/50 focus-visible:ring-offset-2
                  disabled:pointer-events-none disabled:opacity-50
                  min-w-[60px] md:min-w-[80px]
                  ${
                    period === p.value
                      ? "bg-gradient-to-br rounded-xl from-theme-500/20 to-theme-900/20 border border-theme-500/30 text-white shadow-lg shadow-theme-500/20"
                      : "text-neutral-400 hover:text-white hover:bg-neutral-800/50 rounded-xl"
                  }
                `}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-4 p-3 rounded-xl bg-neutral-800/30 animate-pulse"
            >
              <div className="flex-shrink-0 relative">
                <div className="w-16 h-16 bg-neutral-700/50 rounded-lg" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-neutral-700/50 rounded w-3/4" />
                <div className="h-3 bg-neutral-700/50 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : topSongs?.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-neutral-400">再生履歴はありません</p>
        </div>
      ) : (
        <div className="space-y-4">
          {topSongs?.map((song, index) => (
            <div
              key={song.id}
              onClick={() => handlePlay(song.id)}
              className="group flex items-center gap-4 p-3 rounded-xl hover:bg-neutral-800/50 transition-all duration-300 cursor-pointer"
            >
              <div className="flex-shrink-0 relative">
                <div className="w-16 h-16 rounded-lg overflow-hidden">
                  <Image
                    fill
                    src={song.image_path}
                    alt={song.title}
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="absolute -top-2 -left-2 w-6 h-6 bg-theme-500/80 rounded-full flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-semibold truncate leading-tight">
                  {song.title}
                </h4>
                <p className="text-neutral-400 text-sm truncate">
                  {song.author}
                </p>
              </div>
              <div className="flex-shrink-0">
                <span className="bg-theme-500/20 text-theme-300 px-3 py-1 rounded-full text-sm whitespace-nowrap">
                  {song.play_count}回再生
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
TopPlayedSongs.displayName = "TopPlayedSongs";

// --- Main Page Component ---

const AccountPage = () => {
  const router = useRouter();
  const { userDetails: user } = useUser();
  const supabaseClient = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await supabaseClient.auth.signOut();
      router.push("/");
      toast.success("ログアウトしました");
    } catch (error) {
      toast.error("エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#0d0d0d] rounded-lg w-full h-full overflow-hidden">
      <div className="h-full overflow-y-auto custom-scrollbar">
        <div className="px-6 py-8 md:px-10 space-y-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-theme-200 to-white bg-clip-text text-transparent">
            アカウント設定
          </h1>

          <div className="space-y-8">
            {/* プロフィールセクション */}
            <div className="relative overflow-hidden bg-gradient-to-br from-neutral-900/80 via-theme-900/20 to-neutral-900/80 backdrop-blur-xl border border-white/[0.05] shadow-lg rounded-2xl p-8">
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-theme-500/10 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-theme-900/10 rounded-full blur-3xl"></div>

              <div className="relative flex flex-col md:flex-row items-start md:items-center gap-8">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-theme-500/30 via-theme-900/20 to-theme-500/30 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
                  <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-full p-1 bg-gradient-to-br from-theme-500 via-theme-600 to-theme-700">
                    <div className="absolute inset-1 rounded-full overflow-hidden">
                      <Image
                        src={user?.avatar_url || "/images/default-avatar.png"}
                        alt="Profile"
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-white via-theme-200 to-white bg-clip-text text-transparent">
                      {user?.full_name || "ユーザー"}
                    </h2>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => setIsEditModalOpen(true)}
                      className="relative overflow-hidden bg-gradient-to-r from-theme-600 to-theme-800 text-white px-5 py-2.5 rounded-xl font-medium hover:shadow-lg hover:shadow-theme-500/20 transition-all duration-300"
                    >
                      <span className="relative z-10">プロフィール編集</span>
                    </button>
                    <button
                      onClick={handleLogout}
                      disabled={isLoading}
                      className="relative overflow-hidden bg-neutral-800 border border-white/10 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-neutral-700 transition-all duration-300"
                    >
                      <span className="relative z-10">
                        {isLoading ? "ログアウト中..." : "ログアウト"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <ColorSchemeSelector />
            <TopPlayedSongs user={user} />

            <AccountModal
              isOpen={isEditModalOpen}
              onClose={() => setIsEditModalOpen(false)}
              user={user}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;
