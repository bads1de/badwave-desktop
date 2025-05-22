import { ReactNode } from "react";

/**
 * オーディオプレイヤーの共通インターフェース
 * ローカルプレイヤーとオンラインプレイヤーで共通の機能を定義
 */
export interface AudioPlayerInterface {
  // 再生状態
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number | null;
  currentSongPath: string | null;

  // 表示用フォーマット済み時間
  formattedCurrentTime: string;
  formattedDuration: string;

  // UI表示用アイコン
  Icon: React.ComponentType<any>;
  VolumeIcon: React.ComponentType<any>;

  // 操作関数
  play: (path: string) => void;
  pause: () => void;
  togglePlayPause: (path?: string) => void;
  handleSeek: (time: number) => void;
  setVolume: (volume: number) => void;

  // 追加設定
  setCurrentSongPath: (path: string | null) => void;

  // オプション: 内部実装用
  audioRef?: React.RefObject<HTMLAudioElement>;
}

/**
 * オーディオプレイヤーフックのプロパティ
 */
export interface AudioPlayerHookProps {
  onEnded?: () => void; // 再生終了時のコールバック
}
