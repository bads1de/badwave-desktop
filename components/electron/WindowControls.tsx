"use client";

import React, { useState, useEffect } from "react";
import { Minus, Square, X } from "lucide-react";
import { windowControls, isElectron, getPlatform } from "@/libs/electron-utils";

interface WindowControlsProps {
  className?: string;
}

/**
 * Electronウィンドウのカスタムコントロールコンポーネント
 * Windows環境でのみ表示され、最小化・最大化・閉じるボタンを提供します
 */
const WindowControls: React.FC<WindowControlsProps> = ({ className = "" }) => {
  const [isClient, setIsClient] = useState(false);
  const [isElectronApp, setIsElectronApp] = useState(false);
  const [platform, setPlatform] = useState("");

  // クライアントサイドでのみ実行される副作用
  useEffect(() => {
    setIsClient(true);
    setIsElectronApp(isElectron());
    setPlatform(getPlatform());
  }, []);

  // サーバーサイドレンダリング時またはクライアントサイドでの初期レンダリング時は何も表示しない
  if (!isClient || !isElectronApp || platform === "darwin") {
    return null;
  }

  return (
    <div className={`fixed top-0 right-0 flex items-center z-50 ${className}`}>
      {/* 最小化ボタン */}
      <button
        onClick={() => windowControls.minimize()}
        className="flex items-center justify-center w-10 h-10 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
        aria-label="最小化"
      >
        <Minus size={16} />
      </button>

      {/* 最大化ボタン */}
      <button
        onClick={() => windowControls.maximize()}
        className="flex items-center justify-center w-10 h-10 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
        aria-label="最大化"
      >
        <Square size={14} />
      </button>

      {/* 閉じるボタン */}
      <button
        onClick={() => windowControls.close()}
        className="flex items-center justify-center w-10 h-10 text-gray-400 transition-colors hover:bg-red-600 hover:text-white"
        aria-label="閉じる"
      >
        <X size={18} />
      </button>
    </div>
  );
};

export default WindowControls;
