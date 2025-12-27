"use client";

import { useEffect, useState } from "react";
import useColorSchemeStore from "@/hooks/stores/useColorSchemeStore";

interface ThemeProviderProps {
  children: React.ReactNode;
}

const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isMounted, setIsMounted] = useState(false);
  const { colorSchemeId } = useColorSchemeStore();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    // data-theme属性を設定（CSS側でテーマ変数が切り替わる）
    document.documentElement.setAttribute("data-theme", colorSchemeId);
  }, [isMounted, colorSchemeId]);

  // ハイドレーションエラーを防ぐため、マウント前は何もレンダリングしない
  if (!isMounted) {
    return <>{children}</>;
  }

  return <>{children}</>;
};

export default ThemeProvider;
