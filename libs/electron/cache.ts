import { isElectron } from "./common";
import type { SongForSync, PlaylistForSync, SpotlightForSync } from "@/types";
import type { SectionItem } from "@/types/local";

/**
 * キャッシュ機能（オフラインライブラリ表示用）
 */
export const cache = {
  /**
   * 曲のメタデータをローカルDBにキャッシュ
   * ダウンロード状態は上書きしない
   */
  syncSongsMetadata: async (
    songs: SongForSync[]
  ): Promise<{ success: boolean; count: number; error?: string }> => {
    if (isElectron()) {
      return window.electron.cache.syncSongsMetadata(songs);
    }

    return { success: false, count: 0, error: "Not in Electron environment" };
  },

  /**
   * プレイリストをローカルDBにキャッシュ
   */
  syncPlaylists: async (
    playlists: PlaylistForSync[]
  ): Promise<{ success: boolean; count: number; error?: string }> => {
    if (isElectron()) {
      return window.electron.cache.syncPlaylists(playlists);
    }

    return { success: false, count: 0, error: "Not in Electron environment" };
  },

  /**
   * プレイリスト内の曲をローカルDBにキャッシュ（メタデータも同期）
   */
  syncPlaylistSongs: async (data: {
    playlistId: string;
    songs: SongForSync[];
  }): Promise<{ success: boolean; count: number; error?: string }> => {
    if (isElectron()) {
      return window.electron.cache.syncPlaylistSongs(data);
    }

    return { success: false, count: 0, error: "Not in Electron environment" };
  },

  /**
   * いいねした曲をローカルDBにキャッシュ（メタデータも同期）
   */
  syncLikedSongs: async (data: {
    userId: string;
    songs: SongForSync[];
  }): Promise<{ success: boolean; count: number; error?: string }> => {
    if (isElectron()) {
      return window.electron.cache.syncLikedSongs(data);
    }

    return { success: false, count: 0, error: "Not in Electron environment" };
  },

  /**
   * キャッシュからプレイリストを取得
   */
  getCachedPlaylists: async (userId: string): Promise<PlaylistForSync[]> => {
    if (isElectron()) {
      return window.electron.cache.getCachedPlaylists(userId);
    }

    return [];
  },

  /**
   * キャッシュからいいね曲を取得（ダウンロード状態付き）
   */
  getCachedLikedSongs: async (userId: string): Promise<SongForSync[]> => {
    if (isElectron()) {
      return window.electron.cache.getCachedLikedSongs(userId);
    }

    return [];
  },

  /**
   * スポットライトのメタデータをローカルDBにキャッシュ
   */
  syncSpotlightsMetadata: async (
    spotlights: SpotlightForSync[]
  ): Promise<{ success: boolean; count: number; error?: string }> => {
    if (isElectron()) {
      return window.electron.cache.syncSpotlightsMetadata(spotlights);
    }

    return { success: false, count: 0, error: "Not in Electron environment" };
  },

  /**
   * セクション情報をローカルDBにキャッシュ (itemIdsの保存)
   */
  syncSection: async (data: {
    key: string;
    data: SectionItem[];
  }): Promise<{ success: boolean; count: number; error?: string }> => {
    if (isElectron()) {
      return window.electron.cache.syncSection(data);
    }
    return { success: false, count: 0, error: "Not in Electron environment" };
  },

  /**
   * キャッシュからプレイリスト内の曲を取得（ダウンロード状態付き）
   */
  getCachedPlaylistSongs: async (playlistId: string): Promise<SongForSync[]> => {
    if (isElectron()) {
      return window.electron.cache.getCachedPlaylistSongs(playlistId);
    }

    return [];
  },

  /**
   * キャッシュからセクションデータを取得
   */
  getSectionData: async (
    key: string,
    type: "songs" | "spotlights" | "playlists"
  ): Promise<SectionItem[]> => {
    if (isElectron()) {
      return window.electron.cache.getSectionData(key, type);
    }

    return [];
  },

  // --- Local-first Mutation Methods ---

  /**
   * いいねを追加（ローカルDB）
   */
  addLikedSong: async (data: {
    userId: string;
    songId: string;
  }): Promise<{ success: boolean; error?: string }> => {
    if (isElectron()) {
      return window.electron.cache.addLikedSong(data);
    }

    return { success: false, error: "Not in Electron environment" };
  },

  /**
   * いいねを削除（ローカルDB）
   */
  removeLikedSong: async (data: {
    userId: string;
    songId: string;
  }): Promise<{ success: boolean; error?: string }> => {
    if (isElectron()) {
      return window.electron.cache.removeLikedSong(data);
    }

    return { success: false, error: "Not in Electron environment" };
  },

  /**
   * いいね状態を取得（ローカルDB）
   */
  getLikeStatus: async (data: {
    userId: string;
    songId: string;
  }): Promise<{ isLiked: boolean; error?: string }> => {
    if (isElectron()) {
      return window.electron.cache.getLikeStatus(data);
    }
    return { isLiked: false, error: "Not in Electron environment" };
  },

  /**
   * プレイリストに曲を追加（ローカルDB）
   */
  addPlaylistSong: async (data: {
    playlistId: string;
    songId: string;
  }): Promise<{ success: boolean; error?: string }> => {
    if (isElectron()) {
      return window.electron.cache.addPlaylistSong(data);
    }

    return { success: false, error: "Not in Electron environment" };
  },

  /**
   * プレイリストから曲を削除（ローカルDB）
   */
  removePlaylistSong: async (data: {
    playlistId: string;
    songId: string;
  }): Promise<{ success: boolean; error?: string }> => {
    if (isElectron()) {
      return window.electron.cache.removePlaylistSong(data);
    }

    return { success: false, error: "Not in Electron environment" };
  },

  /**
   * 単一の曲情報を取得（ローカルDB）
   */
  getSongById: async (songId: string): Promise<SongForSync | null> => {
    if (isElectron()) {
      return window.electron.cache.getSongById(songId);
    }

    return null;
  },

  /**
   * 単一のプレイリスト情報を取得（ローカルDB）
   */
  getPlaylistById: async (playlistId: string): Promise<PlaylistForSync | null> => {
    if (isElectron()) {
      return window.electron.cache.getPlaylistById(playlistId);
    }
    return null;
  },

  /**
   * ページネーション対応の曲取得（ローカルDB）
   */
  getSongsPaginated: async (offset: number, limit: number): Promise<SongForSync[]> => {
    if (isElectron()) {
      return window.electron.cache.getSongsPaginated(offset, limit);
    }

    return [];
  },

  /**
   * 曲の総件数を取得（ローカルDB）
   */
  getSongsTotalCount: async (): Promise<number> => {
    if (isElectron()) {
      return window.electron.cache.getSongsTotalCount();
    }

    return 0;
  },
};
