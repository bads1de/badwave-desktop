"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { createClient } from "@/libs/supabase/client";
import { useUser } from "@/hooks/auth/useUser";
import Image from "next/image";
import AccountModal from "./AccountModal";
import TopPlayedSongs from "./TopPlayedSongs";
import ColorSchemeSelector from "./ColorSchemeSelector";

const AccountContent = () => {
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
                <span className="absolute inset-0 bg-gradient-to-r from-theme-700 to-theme-900 opacity-0 hover:opacity-100 transition-opacity duration-300"></span>
              </button>
              <button
                onClick={handleLogout}
                disabled={isLoading}
                className="relative overflow-hidden bg-neutral-800 border border-white/10 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-neutral-700 transition-all duration-300"
              >
                <span className="relative z-10">ログアウト</span>
                {isLoading && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* カラースキーム選択 */}
      <ColorSchemeSelector />

      {/* 再生ランキング */}
      <TopPlayedSongs user={user} />

      {/* プロフィール編集モーダル */}
      <AccountModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={user}
      />
    </div>
  );
};

export default AccountContent;
