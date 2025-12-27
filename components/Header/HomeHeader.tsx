"use client";

import { useState, useEffect, memo } from "react";
import { useRouter } from "next/navigation";
import { twMerge } from "tailwind-merge";
import { useUser } from "@/hooks/auth/useUser";
import useAuthModal from "@/hooks/auth/useAuthModal";
import Button from "../common/Button";
import Image from "next/image";
import { User } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { createClient } from "@/libs/supabase/client";

interface HeaderProps {
  className?: string;
}

const HomeHeader: React.FC<HeaderProps> = memo(({ className }) => {
  const router = useRouter();
  const authModal = useAuthModal();
  const { user, userDetails } = useUser();
  const supabaseClient = createClient();
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle logout
  const handleLogout = async () => {
    try {
      await supabaseClient.auth.signOut();
      toast.success("ログアウトしました");
      router.refresh();
    } catch (error) {
      toast.error("エラーが発生しました");
    }
  };

  return (
    <div
      className={twMerge(
        `
        fixed
        top-0
        z-50
        w-full
        h-fit
        bg-gradient-to-b
        from-theme-900/10
        via-neutral-900/95
        to-neutral-900/90
        backdrop-blur-xl
        transition-all
        duration-300
        `,
        scrolled ? "shadow-lg shadow-theme-900/10" : "",
        className
      )}
    >
      <div className="w-full px-6 py-4">
        <div className="flex items-center justify-between w-full">
          {/* Logo and app name */}
          <div className="flex items-center gap-x-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-theme-500/20 to-theme-900/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
              <Image
                src="/logo.svg"
                alt="Logo"
                width={36}
                height={36}
                className="relative cursor-pointer transition-all duration-300 hover:scale-105 z-10"
                onClick={() => router.push("/")}
              />
            </div>
            <h1 className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-neutral-400">
              BadWave
            </h1>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-x-4">
            {user ? (
              <div className="flex items-center gap-x-4">
                {/* User profile */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-theme-500/10 to-theme-900/10 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-all duration-500" />
                  <Link href="/account">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden border border-white/10 flex-shrink-0 shadow-inner group transition-transform duration-300 hover:scale-105">
                      {userDetails?.avatar_url ? (
                        <Image
                          src={userDetails.avatar_url}
                          alt="ユーザーアバター"
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width:1280px) 25vw, 20vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-900">
                          <User className="w-5 h-5 text-neutral-400" />
                        </div>
                      )}
                    </div>
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <Button
                    onClick={authModal.onOpen}
                    className="bg-transparent text-neutral-300 font-medium hover:text-white"
                    size="sm"
                  >
                    ログイン
                  </Button>
                </div>
                <div>
                  <Button
                    onClick={authModal.onOpen}
                    className="px-6 bg-gradient-to-r from-theme-600 to-theme-800 hover:from-theme-500 hover:to-theme-700 transition-all duration-300"
                    size="sm"
                  >
                    新規登録
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

// displayName を設定
HomeHeader.displayName = "HomeHeader";

export default HomeHeader;
