"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { User, Settings, LogOut } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/libs/supabase/client";
import { toast } from "react-hot-toast";
import { ERROR_MESSAGES } from "@/constants/errorMessages";
import useAuthModal from "@/hooks/auth/useAuthModal";
import { ROUTES } from "@/constants";
import { UserDetails } from "@/types";

interface UserCardProps {
  userDetails: UserDetails | null;
  isCollapsed: boolean;
}

const UserCard: React.FC<UserCardProps> = ({ userDetails, isCollapsed }) => {
  const router = useRouter();
  const supabaseClient = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const authModal = useAuthModal();
  const [isHovered, setIsHovered] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);

    try {
      await supabaseClient.auth.signOut();
      router.push("/");
      toast.success("ログアウトしました");
    } catch (error) {
      toast.error(ERROR_MESSAGES.GENERIC_ERROR);
    } finally {
      setIsLoading(false);
    }
  };

  if (!userDetails) {
    if (isCollapsed) {
      return (
        <div className="px-2">
          <button
            onClick={authModal.onOpen}
            className="w-full aspect-square rounded-none bg-[#0a0a0f] border border-theme-500/30 hover:border-theme-500 hover:shadow-[0_0_15px_rgba(var(--theme-500),0.4)] transition-all duration-500 relative group overflow-hidden cyber-glitch"
          >
            <div className="absolute inset-0 bg-theme-500/10 opacity-0 group-hover:opacity-100 transition-all duration-500" />
            <div className="w-full h-full flex items-center justify-center relative z-10">
              <User className="w-8 h-8 text-theme-500/60 group-hover:text-white transition-colors duration-300 drop-shadow-[0_0_5px_rgba(var(--theme-500),0.5)]" />
            </div>
            {/* 角の装飾 */}
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-theme-500/40" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-theme-500/40" />
          </button>
        </div>
      );
    }

    return (
      <Card className="overflow-hidden rounded-none bg-[#0a0a0f]/80 backdrop-blur-xl border border-theme-500/20 hover:border-theme-500/50 transition-all duration-500 shadow-[inset_0_0_15px_rgba(var(--theme-500),0.05)] group/card cyber-glitch mx-2">
        <button
          onClick={authModal.onOpen}
          className="w-full p-4 relative hover:bg-theme-500/10 transition-all duration-300"
        >
          <div className="flex items-center gap-4">
            <div className="relative w-12 h-12 rounded-none overflow-hidden border border-theme-500/40 flex-shrink-0 shadow-[0_0_10px_rgba(var(--theme-500),0.2)] bg-theme-900/50">
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-6 h-6 text-theme-500 animate-pulse" />
              </div>
            </div>
            <div className="flex-1 text-left">
              <p className="text-[10px] font-mono text-theme-500/60 uppercase tracking-widest mb-1">
                // SYSTEM_LOGIN
              </p>
              <p className="text-sm font-bold font-mono text-white tracking-widest uppercase group-hover/card:text-theme-300 transition-colors">
                [ CONNECT_ID ]
              </p>
            </div>
          </div>
        </button>
      </Card>
    );
  }

  if (isCollapsed) {
    return (
      <div className="px-2">
        <button
          onClick={() => router.push(ROUTES.ACCOUNT)}
          className="w-full aspect-square rounded-none bg-[#0a0a0f] border border-theme-500/30 hover:border-theme-500 hover:shadow-[0_0_20px_rgba(var(--theme-500),0.4)] transition-all duration-500 relative group overflow-hidden cyber-glitch"
        >
          <div className="absolute inset-0 bg-theme-500/10 opacity-0 group-hover:opacity-100 transition-all duration-500" />
          {userDetails?.avatar_url ? (
            <Image
              src={userDetails.avatar_url}
              alt="ユーザーアバター"
              fill
              className="object-cover transition-all duration-700 group-hover:scale-125 group-hover:opacity-80"
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width:1280px) 25vw, 20vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center relative z-10">
              <User className="w-8 h-8 text-theme-500/60 group-hover:text-white transition-colors duration-300" />
            </div>
          )}
          {/* 角の装飾 */}
          <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-theme-500" />
        </button>
      </div>
    );
  }

  return (
    <Card
      className="overflow-hidden rounded-none bg-[#0a0a0f]/80 backdrop-blur-xl border border-theme-500/30 hover:border-theme-500/60 transition-all duration-500 shadow-[inset_0_0_20px_rgba(var(--theme-500),0.05)] group/card cyber-glitch mx-2"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative">
        {/* 背景装飾 */}
        <div className="absolute inset-0 bg-gradient-to-br from-theme-500/10 via-transparent to-transparent opacity-40 group-hover/card:opacity-100 transition-all duration-500" />

        <div className="p-3 relative">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-none overflow-hidden border-2 border-theme-500/40 flex-shrink-0 shadow-[0_0_15px_rgba(var(--theme-500),0.2)] group-hover/card:border-theme-500 transition-all duration-500">
              {userDetails?.avatar_url ? (
                <Image
                  src={userDetails.avatar_url}
                  alt="ユーザーアバター"
                  fill
                  className="object-cover transition-all duration-700 group-hover/card:scale-125 group-hover/card:opacity-70"
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width:1280px) 25vw, 20vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-theme-900">
                  <User className="w-5 h-5 text-theme-500" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 font-mono flex flex-col justify-center">
              <p className="text-[8px] text-theme-500/60 uppercase tracking-widest mb-0.5 animate-pulse truncate">
                [ OP_ID ]
              </p>
              <p className="text-xs font-bold text-white truncate uppercase tracking-widest drop-shadow-[0_0_8px_rgba(var(--theme-500),0.5)]">
                {userDetails?.full_name || "UNKNOWN"}
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <button
                onClick={() => router.push(ROUTES.ACCOUNT)}
                className="p-1.5 bg-theme-500/10 hover:bg-theme-500/30 border border-theme-500/30 text-theme-400 hover:text-white transition-all duration-300 shadow-[0_0_10px_rgba(var(--theme-500),0.1)]"
              >
                <Settings size={14} />
              </button>
              <button
                onClick={handleLogout}
                className="p-1.5 bg-red-500/10 hover:bg-red-500/30 border border-red-500/30 text-red-400 hover:text-white transition-all duration-300 shadow-[0_0_10px_rgba(239,68,68,0.1)]"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* 下部のプログレスバー的な装飾 */}
        <div className="h-0.5 w-full bg-theme-500/10 relative overflow-hidden">
          <div className="absolute top-0 left-0 h-full bg-theme-500/40 w-1/3 animate-pulse" />
        </div>
      </div>
    </Card>
  );
};

export default UserCard;
