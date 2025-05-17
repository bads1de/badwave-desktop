'use client';

import React from 'react';
import { Minus, Square, X } from 'lucide-react';
import { windowControls, isElectron, getPlatform } from '@/libs/electron-utils';

interface WindowControlsProps {
  className?: string;
}

/**
 * Electronウィンドウのカスタムコントロールコンポーネント
 * Windows環境でのみ表示され、最小化・最大化・閉じるボタンを提供します
 */
const WindowControls: React.FC<WindowControlsProps> = ({ className = '' }) => {
  // Electronでない場合、またはmacOSの場合は表示しない
  // (macOSではネイティブのウィンドウコントロールを使用)
  if (!isElectron() || getPlatform() === 'darwin') {
    return null;
  }

  return (
    <div className={`flex items-center -mr-2 ${className}`}>
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
