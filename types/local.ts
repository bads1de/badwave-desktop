// デスクトップ専用（Electronメインプロセス / オフラインDB / IPC）の型定義
// web版 badwave の types/index.ts との差分をここに集約し、
// 共有型（types/index.ts）のドリフトを防ぐ

export interface LocalFile {
  path: string;
  metadata?: FileMetadata;
  error?: string;
  lastModified?: number;
}

/**
 * Electron IPC用のメタデータ型
 */
export interface FileMetadata {
  title?: string;
  artist?: string;
  album?: string;
  genre?: string;
  year?: number;
  track?: number;
  duration?: number;
  picture?: { format: string; data: Buffer }[];
  common?: {
    title?: string;
    artist?: string;
    album?: string;
    genre?: string[];
    year?: number;
    track?: number;
  };
  format?: {
    duration?: number;
    bitrate?: number;
    sampleRate?: number;
  };
}

/**
 * ライブラリファイル情報の型
 */
export interface LibraryFileInfo {
  metadata?: FileMetadata;
  lastModified: number;
  error?: string;
}

/**
 * ライブラリ全体の型
 */
export interface MusicLibrary {
  directoryPath: string;
  files: {
    [filePath: string]: LibraryFileInfo;
  };
}

// renderer/main間で共有する型定義

export interface OfflineSong {
  id: string;
  user_id: string;
  title: string;
  author: string;
  song_path: string;
  image_path: string | null;
  original_song_path: string | null;
  original_image_path: string | null;
  duration: number | null;
  genre: string | null;
  lyrics: string | null;
  created_at: string | null;
  downloaded_at: Date | null;
}

export interface SongDownloadPayload {
  id: string;
  userId: string;
  title: string;
  author: string;
  song_path: string;
  image_path: string;
  duration?: number;
  genre?: string;
  lyrics?: string;
  video_path?: string;
  created_at: string;
}

/**
 * セクションデータのアイテム型（get-section-data用）
 */
export interface SectionItem {
  id: string;
  userId?: string | null;
  title: string;
  author?: string;
  description?: string | null;
  genre?: string | null;
  video_path?: string | null;
  thumbnail_path?: string | null;
  local_video_path?: string | null;
  local_thumbnail_path?: string | null;
  image_path?: string | null;
  is_public?: boolean;
  created_at?: string | null;
  [key: string]: unknown;
}

/**
 * DBのsongsテーブル行の型（mapDbSongToResponse用）
 */
export interface DbSongRow {
  id: string;
  userId?: string | null;
  title: string;
  author: string;
  originalSongPath?: string | null;
  originalImagePath?: string | null;
  originalVideoPath?: string | null;
  songPath?: string | null;
  imagePath?: string | null;
  videoPath?: string | null;
  duration?: number | null;
  genre?: string | null;
  playCount?: number | null;
  likeCount?: number | null;
  lyrics?: string | null;
  createdAt?: string | null;
  [key: string]: unknown;
}
