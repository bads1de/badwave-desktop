import { ipcMain } from "electron";
import { debugLog } from "../utils";
import { getDb } from "../db/client";
import { songs, playlists, playlistSongs, likedSongs } from "../db/schema";
import { eq, inArray } from "drizzle-orm";

/**
 * Supabase形式の曲データ
 */
interface SupabaseSong {
  id: string;
  user_id: string;
  title: string;
  author: string;
  song_path: string;
  image_path: string | null;
  duration?: number;
  genre?: string;
  lyrics?: string;
  created_at: string;
}

/**
 * Supabase形式のプレイリストデータ
 */
interface SupabasePlaylist {
  id: string;
  user_id: string;
  title: string;
  image_path?: string | null;
  is_public: boolean;
  created_at: string;
}

/**
 * Supabase形式のいいねデータ
 */
interface SupabaseLikedSong {
  user_id: string;
  song_id: string;
  created_at: string;
}

/**
 * Supabase形式のプレイリスト内曲データ
 */
interface SupabasePlaylistSong {
  id: string;
  playlist_id: string;
  song_id: string;
  created_at?: string;
}

export function setupCacheHandlers() {
  const db = getDb();

  /**
   * 曲のメタデータをローカルDBにキャッシュ
   * ダウンロード状態（songPath）は上書きしない
   */
  ipcMain.handle(
    "sync-songs-metadata",
    async (_, songsData: SupabaseSong[]) => {
      debugLog(
        `[IPC] sync-songs-metadata: ${songsData.length} 件の曲をキャッシュ`
      );

      try {
        let count = 0;

        for (const song of songsData) {
          // 既存のレコードを確認（ダウンロード状態を保持するため）
          const existing = await db.query.songs.findFirst({
            where: eq(songs.id, song.id),
            columns: { songPath: true, imagePath: true, downloadedAt: true },
          });

          // ローカルDBに保存するレコード
          const record = {
            id: song.id,
            userId: song.user_id,
            title: song.title,
            author: song.author,
            // ダウンロード状態は既存の値を維持、なければnull
            songPath: existing?.songPath ?? null,
            imagePath: existing?.imagePath ?? null,
            // リモートURLを保存
            originalSongPath: song.song_path,
            originalImagePath: song.image_path,
            duration: song.duration,
            genre: song.genre,
            lyrics: song.lyrics,
            createdAt: song.created_at,
            downloadedAt: existing?.downloadedAt ?? null,
          };

          await db
            .insert(songs)
            .values(record)
            .onConflictDoUpdate({
              target: songs.id,
              set: {
                // ダウンロード関連以外を更新
                title: record.title,
                author: record.author,
                originalSongPath: record.originalSongPath,
                originalImagePath: record.originalImagePath,
                duration: record.duration,
                genre: record.genre,
                lyrics: record.lyrics,
                createdAt: record.createdAt,
              },
            });

          count++;
        }

        debugLog(`[IPC] sync-songs-metadata: ${count} 件をキャッシュしました`);
        return { success: true, count };
      } catch (error: any) {
        console.error("[IPC] Failed to sync songs metadata:", error);
        return { success: false, error: error.message };
      }
    }
  );

  /**
   * プレイリストをローカルDBにキャッシュ
   */
  ipcMain.handle(
    "sync-playlists",
    async (_, playlistsData: SupabasePlaylist[]) => {
      debugLog(
        `[IPC] sync-playlists: ${playlistsData.length} 件のプレイリストをキャッシュ`
      );

      try {
        let count = 0;

        for (const playlist of playlistsData) {
          const record = {
            id: playlist.id,
            userId: playlist.user_id,
            title: playlist.title,
            imagePath: playlist.image_path ?? null,
            isPublic: playlist.is_public,
            createdAt: playlist.created_at,
          };

          await db.insert(playlists).values(record).onConflictDoUpdate({
            target: playlists.id,
            set: record,
          });

          count++;
        }

        debugLog(`[IPC] sync-playlists: ${count} 件をキャッシュしました`);
        return { success: true, count };
      } catch (error: any) {
        console.error("[IPC] Failed to sync playlists:", error);
        return { success: false, error: error.message };
      }
    }
  );

  /**
   * プレイリスト内の曲をローカルDBにキャッシュ
   */
  ipcMain.handle(
    "sync-playlist-songs",
    async (_, playlistSongsData: SupabasePlaylistSong[]) => {
      debugLog(
        `[IPC] sync-playlist-songs: ${playlistSongsData.length} 件をキャッシュ`
      );

      try {
        let count = 0;

        for (const ps of playlistSongsData) {
          const record = {
            id: ps.id,
            playlistId: ps.playlist_id,
            songId: ps.song_id,
            addedAt: ps.created_at ?? null,
          };

          await db.insert(playlistSongs).values(record).onConflictDoNothing();
          count++;
        }

        debugLog(`[IPC] sync-playlist-songs: ${count} 件をキャッシュしました`);
        return { success: true, count };
      } catch (error: any) {
        console.error("[IPC] Failed to sync playlist songs:", error);
        return { success: false, error: error.message };
      }
    }
  );

  /**
   * いいねした曲をローカルDBにキャッシュ
   */
  ipcMain.handle(
    "sync-liked-songs",
    async (_, likedSongsData: SupabaseLikedSong[]) => {
      debugLog(
        `[IPC] sync-liked-songs: ${likedSongsData.length} 件のいいねをキャッシュ`
      );

      try {
        let count = 0;

        for (const liked of likedSongsData) {
          const record = {
            userId: liked.user_id,
            songId: liked.song_id,
            likedAt: liked.created_at,
          };

          await db.insert(likedSongs).values(record).onConflictDoNothing();
          count++;
        }

        debugLog(`[IPC] sync-liked-songs: ${count} 件をキャッシュしました`);
        return { success: true, count };
      } catch (error: any) {
        console.error("[IPC] Failed to sync liked songs:", error);
        return { success: false, error: error.message };
      }
    }
  );

  /**
   * キャッシュされたプレイリストを取得
   */
  ipcMain.handle("get-cached-playlists", async (_, userId: string) => {
    debugLog(`[IPC] get-cached-playlists for user: ${userId}`);

    try {
      const cachedPlaylists = await db.query.playlists.findMany({
        where: eq(playlists.userId, userId),
      });

      // Supabase形式に変換して返す
      return cachedPlaylists.map((p) => ({
        id: p.id,
        user_id: p.userId,
        title: p.title,
        image_path: p.imagePath,
        is_public: p.isPublic,
        created_at: p.createdAt,
      }));
    } catch (error: any) {
      console.error("[IPC] Failed to get cached playlists:", error);
      return [];
    }
  });

  /**
   * キャッシュされたいいね曲を取得（ダウンロード状態付き）
   */
  ipcMain.handle("get-cached-liked-songs", async (_, userId: string) => {
    debugLog(`[IPC] get-cached-liked-songs for user: ${userId}`);

    try {
      // いいねレコードを取得
      const likes = await db.query.likedSongs.findMany({
        where: eq(likedSongs.userId, userId),
      });

      if (likes.length === 0) {
        return [];
      }

      // 対応する曲のメタデータを取得
      const songIds = likes.map((l) => l.songId);
      const songsData = await db.query.songs.findMany({
        where: inArray(songs.id, songIds),
      });

      // 曲データにダウンロード状態を追加して返す
      return songsData.map((song) => ({
        id: song.id,
        user_id: song.userId,
        title: song.title,
        author: song.author,
        song_path: song.originalSongPath, // オフライン表示用にはリモートURL
        image_path: song.originalImagePath,
        duration: song.duration,
        genre: song.genre,
        lyrics: song.lyrics,
        created_at: song.createdAt,
        // ダウンロード状態を追加
        is_downloaded: song.songPath !== null,
        local_song_path: song.songPath, // ダウンロード済みならローカルパス
        local_image_path: song.imagePath,
      }));
    } catch (error: any) {
      console.error("[IPC] Failed to get cached liked songs:", error);
      return [];
    }
  });

  /**
   * キャッシュされたプレイリスト内の曲を取得（ダウンロード状態付き）
   */
  ipcMain.handle("get-cached-playlist-songs", async (_, playlistId: string) => {
    debugLog(`[IPC] get-cached-playlist-songs for playlist: ${playlistId}`);

    try {
      // プレイリスト内の曲IDを取得
      const psSongs = await db.query.playlistSongs.findMany({
        where: eq(playlistSongs.playlistId, playlistId),
      });

      if (psSongs.length === 0) {
        return [];
      }

      // 対応する曲のメタデータを取得
      const songIds = psSongs.map((ps) => ps.songId);
      const songsData = await db.query.songs.findMany({
        where: inArray(songs.id, songIds),
      });

      // 曲データにダウンロード状態を追加して返す
      return songsData.map((song) => ({
        id: song.id,
        user_id: song.userId,
        title: song.title,
        author: song.author,
        song_path: song.originalSongPath,
        image_path: song.originalImagePath,
        duration: song.duration,
        genre: song.genre,
        lyrics: song.lyrics,
        created_at: song.createdAt,
        is_downloaded: song.songPath !== null,
        local_song_path: song.songPath,
        local_image_path: song.imagePath,
      }));
    } catch (error: any) {
      console.error("[IPC] Failed to get cached playlist songs:", error);
      return [];
    }
  });
}
