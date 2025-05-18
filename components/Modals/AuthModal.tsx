"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import useAuthModal from "@/hooks/auth/useAuthModal";
import ja from "@/constants/ja.json";
import Modal from "./Modal";
import { createClient } from "@/libs/supabase/client";

const AuthModal = () => {
  const supabaseClient = createClient();
  const router = useRouter();
  const { onClose, isOpen } = useAuthModal();
  const [session, setSession] = useState<any>(null);

  // セッション状態を監視
  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabaseClient.auth.getSession();
      setSession(data.session);
    };

    getSession();

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabaseClient]);

  // セッションが存在する場合、モーダルを閉じる
  useEffect(() => {
    if (session) {
      router.refresh();
      onClose();
    }
  }, [session, router, onClose]);

  const onChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Modal
      title="おかえりなさい"
      description="ログインしてください"
      isOpen={isOpen}
      onChange={onChange}
    >
      <Auth
        theme="dark"
        magicLink
        providers={["google"]}
        localization={{
          variables: ja,
        }}
        supabaseClient={supabaseClient}
        appearance={{
          theme: ThemeSupa,
          variables: {
            default: {
              colors: {
                brand: "#404040",
                brandAccent: "#4c1d95",
              },
            },
          },
        }}
        redirectTo={`${window.location.origin}/api/auth/callback`}
      />
    </Modal>
  );
};

export default AuthModal;
