import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * 再生状態を永続化するストア
 * Spotify風の「続きから再生」機能を実現
 *
 * 保存タイミング:
 * - 一時停止時
 * - シーク時
 * - 曲変更時
 * - 定期保存（5秒ごと、デバウンス）
 * - ページ離脱時（beforeunload）
 */
interface PlaybackState {
  /** 再生中の曲ID */
  songId: string | null;
  /** 再生位置（秒） */
  position: number;
  /** プレイリストの曲ID群 */
  playlist: string[];
  /** 最終更新タイムスタンプ */
  timestamp: number;
  /** ストアがハイドレート完了したかどうか */
  hasHydrated: boolean;
  /** 再生状態を復元中かどうか（自動再生防止用） */
  isRestoring: boolean;
}

interface PlaybackStateActions {
  /** 再生状態を保存 */
  savePlaybackState: (
    songId: string,
    position: number,
    playlist?: string[]
  ) => void;
  /** 再生位置のみを更新（デバウンス用） */
  updatePosition: (position: number) => void;
  /** 再生状態をクリア */
  clearPlaybackState: () => void;
  /** ハイドレート状態を設定 */
  setHasHydrated: (state: boolean) => void;
  /** 復元中フラグを設定 */
  setIsRestoring: (isRestoring: boolean) => void;
}

type PlaybackStateStore = PlaybackState & PlaybackStateActions;

/** 再生状態の有効期限（7日間） */
const EXPIRATION_MS = 7 * 24 * 60 * 60 * 1000;

const usePlaybackStateStore = create<PlaybackStateStore>()(
  persist(
    (set, get) => ({
      songId: null,
      position: 0,
      playlist: [],
      timestamp: 0,
      hasHydrated: false,
      isRestoring: false,

      savePlaybackState: (
        songId: string,
        position: number,
        playlist?: string[]
      ) => {
        set({
          songId,
          position,
          playlist: playlist ?? get().playlist,
          timestamp: Date.now(),
        });
      },

      updatePosition: (position: number) => {
        const { songId } = get();
        if (songId) {
          set({
            position,
            timestamp: Date.now(),
          });
        }
      },

      clearPlaybackState: () => {
        set({
          songId: null,
          position: 0,
          playlist: [],
          timestamp: 0,
        });
      },

      setHasHydrated: (state: boolean) => set({ hasHydrated: state }),

      setIsRestoring: (isRestoring: boolean) => set({ isRestoring }),
    }),
    {
      name: "badwave-playback-state",
      onRehydrateStorage: () => (state) => {
        if (state) {
          // 有効期限チェック
          const isExpired = Date.now() - state.timestamp > EXPIRATION_MS;
          if (isExpired) {
            state.clearPlaybackState();
          }
          state.setHasHydrated(true);
        }
      },
    }
  )
);

export default usePlaybackStateStore;

/**
 * デバウンスされた再生位置保存用のユーティリティ
 * 再生中に5秒ごとに呼び出すことを想定
 */
export const POSITION_SAVE_INTERVAL_MS = 5000;
