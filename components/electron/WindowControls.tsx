"use client";

import React, { useState, useEffect } from "react";
import { Minus, Square, X } from "lucide-react";
import { windowControls, isElectron, getPlatform } from "@/libs/electron";

interface WindowControlsProps {
  className?: string;
}

/**
 * Electronウィンドウのカスタムコントロールコンポーネント
 * Windows環境でのみ表示され、最小化・最大化・閉じるボタンを提供します
 * ドラッグ可能な領域も含まれており、ウィンドウの移動が可能です
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

    // Electronアプリの場合、bodyにクラスを追加
    if (isElectron() && platform !== "darwin") {
      document.body.classList.add("electron-app");
    }
  }, [platform]);

  // サーバーサイドレンダリング時またはクライアントサイドでの初期レンダリング時は何も表示しない
  if (!isClient || !isElectronApp || platform === "darwin") {
    return null;
  }

  return (
    <div
      className={`fixed top-0 left-0 right-0 h-8 bg-black/80 backdrop-blur-sm z-50 ${className}`}
      style={{ WebkitAppRegion: "drag" } as any}
    >
      <div className="fixed top-0 right-0 flex items-center">
        {/* 最小化ボタン */}
        <button
          onClick={() => windowControls.minimize()}
          className="flex items-center justify-center w-10 h-8 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
          style={{ WebkitAppRegion: "no-drag" } as any}
          aria-label="最小化"
        >
          <Minus size={16} />
        </button>

        {/* 最大化ボタン */}
        <button
          onClick={() => windowControls.maximize()}
          className="flex items-center justify-center w-10 h-8 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
          style={{ WebkitAppRegion: "no-drag" } as any}
          aria-label="最大化"
        >
          <Square size={14} />
        </button>

        {/* 閉じるボタン */}
        <button
          onClick={() => windowControls.close()}
          className="flex items-center justify-center w-10 h-8 text-gray-400 transition-colors hover:bg-red-600 hover:text-white"
          style={{ WebkitAppRegion: "no-drag" } as any}
          aria-label="閉じる"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export default WindowControls;
