import { ipcMain } from "electron";
import { getDb } from "../db/client";
import {
  songs,
  playlists,
  playlistSongs,
  likedSongs,
  sectionCache,
  spotlights,
} from "../db/schema";
import { eq, sql, inArray } from "drizzle-orm";

/**
 * IDを文字列に強制変換し、".0" などの浮動小数点表記を除去する
 */
const normalizeId = (id: any): string => {
  if (id === null || id === undefined) return "";
  const s = String(id);
  return s.includes(".") ? s.split(".")[0] : s;
};

export function setupCacheHandlers() {
  const db = getDb();

  /**
   * 楽曲メタデータを内部でupsertする
   */
  async function internalSyncSongs(songsData: any[]) {
    let count = 0;
    for (const song of songsData) {
      const songId = normalizeId(song.id);

      const existing = await db.query.songs.findFirst({
        where: eq(songs.id, songId),
        columns: {
          songPath: true,
          imagePath: true,
          videoPath: true,
          downloadedAt: true,
        },
      });

      const record = {
        id: songId,
        userId: String(song.user_id || ""),
        title: String(song.title || "Unknown Title"),
        author: String(song.author || "Unknown Author"),
        songPath: existing?.songPath ?? null,
        imagePath: existing?.imagePath ?? null,
        videoPath: existing?.videoPath ?? null,
        originalSongPath: song.song_path,
        originalImagePath: song.image_path,
        originalVideoPath: song.video_path,
        duration: song.duration ? Number(song.duration) : null,
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
            title: record.title,
            author: record.author,
            originalSongPath: record.originalSongPath,
            originalImagePath: record.originalImagePath,
            originalVideoPath: record.originalVideoPath,
            duration: record.duration,
            genre: record.genre,
            lyrics: record.lyrics,
            createdAt: record.createdAt,
          },
        });
      count++;
    }
    return count;
  }

  // --- Handlers ---

  ipcMain.handle("sync-songs-metadata", async (_, data: any[]) => {
    try {
      const count = await internalSyncSongs(data);
      return { success: true, count };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("sync-playlists", async (_, data: any[]) => {
    try {
      for (const item of data) {
        await db
          .insert(playlists)
          .values({
            id: normalizeId(item.id),
            userId: String(item.user_id),
            title: String(item.title),
            imagePath: item.image_path,
            isPublic: Boolean(item.is_public),
            createdAt: item.createdAt || item.created_at,
          })
          .onConflictDoUpdate({
            target: playlists.id,
            set: {
              title: String(item.title),
              imagePath: item.image_path,
              isPublic: Boolean(item.is_public),
            },
          });
      }
      return { success: true, count: data.length };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(
    "sync-playlist-songs",
    async (
      _,
      { playlistId, songs: fullSongsData }: { playlistId: string; songs: any[] }
    ) => {
      try {
        await internalSyncSongs(fullSongsData);
        for (const songData of fullSongsData) {
          const songId = normalizeId(songData.id);
          const psId = `${playlistId}_${songId}`;
          await db
            .insert(playlistSongs)
            .values({
              id: psId,
              playlistId: normalizeId(playlistId),
              songId: songId,
              addedAt: songData.created_at,
            })
            .onConflictDoNothing();
        }
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }
  );

  ipcMain.handle(
    "sync-liked-songs",
    async (
      _,
      { userId, songs: fullSongsData }: { userId: string; songs: any[] }
    ) => {
      try {
        await internalSyncSongs(fullSongsData);
        // better-sqlite3 は同期的なドライバーなので、トランザクション内で async/await は使用不可
        // 代わりに、個別のinsert文をシンプルなループで実行
        for (const songData of fullSongsData) {
          await db
            .insert(likedSongs)
            .values({
              userId: String(userId),
              songId: normalizeId(songData.id),
              likedAt: songData.created_at || new Date().toISOString(),
            })
            .onConflictDoNothing();
        }
        return { success: true };
      } catch (error: any) {
        console.error("[Sync] Liked Songs Error:", error);
        return { success: false, error: error.message };
      }
    }
  );

  ipcMain.handle("get-cached-liked-songs", async (_, userId: string) => {
    try {
      const results = await db
        .select()
        .from(likedSongs)
        .leftJoin(
          songs,
          sql`CAST(${likedSongs.songId} AS TEXT) = CAST(${songs.id} AS TEXT)`
        )
        .where(eq(likedSongs.userId, String(userId)));

      return results.map((row) => {
        const liked_songs = row.liked_songs;
        const song = row.songs;
        return {
          id: song?.id || liked_songs.songId,
          user_id: liked_songs.userId,
          title: song?.title || "Unknown Title",
          author: song?.author || "Unknown Author",
          song_path: song?.originalSongPath || null,
          image_path: song?.originalImagePath || null,
          video_path: song?.originalVideoPath || null,
          is_downloaded: !!song?.songPath,
          local_song_path: song?.songPath || null,
          local_image_path: song?.imagePath || null,
          local_video_path: song?.videoPath || null,
          created_at: liked_songs.likedAt,
        };
      });
    } catch (error) {
      console.error("[IPC] get-cached-liked-songs error:", error);
      return [];
    }
  });

  ipcMain.handle("get-cached-playlists", async (_, userId: string) => {
    try {
      const data = await db.query.playlists.findMany({
        where: eq(playlists.userId, String(userId)),
      });
      return data.map((item) => ({
        id: item.id,
        user_id: item.userId,
        title: item.title,
        image_path: item.imagePath,
        is_public: item.isPublic,
        created_at: item.createdAt,
      }));
    } catch (error) {
      return [];
    }
  });

  ipcMain.handle("get-cached-playlist-songs", async (_, playlistId: string) => {
    try {
      const results = await db
        .select()
        .from(playlistSongs)
        .leftJoin(
          songs,
          sql`CAST(${playlistSongs.songId} AS TEXT) = CAST(${songs.id} AS TEXT)`
        )
        .where(eq(playlistSongs.playlistId, normalizeId(playlistId)));

      return results.map((row) => {
        const playlist_songs = row.playlist_songs;
        const song = row.songs;
        return {
          id: song?.id || playlist_songs.songId,
          user_id: song?.userId || "",
          title: song?.title || "Unknown Title",
          author: song?.author || "Unknown Author",
          song_path: song?.originalSongPath || null,
          image_path: song?.originalImagePath || null,
          video_path: song?.originalVideoPath || null,
          is_downloaded: !!song?.songPath,
          local_song_path: song?.songPath || null,
          local_image_path: song?.imagePath || null,
          local_video_path: song?.videoPath || null,
          created_at: playlist_songs.addedAt,
        };
      });
    } catch (error) {
      return [];
    }
  });

  // --- Section Cache Handlers ---

  ipcMain.handle("sync-spotlights-metadata", async (_, data: any[]) => {
    try {
      let count = 0;
      for (const item of data) {
        // IDの正規化は必要？Supabase UUIDならそのまま文字列化
        const id = normalizeId(item.id);

        const record = {
          id: id,
          title: String(item.title || "Unknown Title"),
          author: String(item.author || "Unknown Author"),
          description: item.description,
          genre: item.genre,
          originalVideoPath: item.video_path,
          originalThumbnailPath: item.thumbnail_path,
          // videoPath, thumbnailPath はローカルパスなので上書きしない
          createdAt: item.created_at,
        };

        await db
          .insert(spotlights)
          .values(record)
          .onConflictDoUpdate({
            target: spotlights.id,
            set: {
              title: record.title,
              author: record.author,
              description: record.description,
              genre: record.genre,
              originalVideoPath: record.originalVideoPath,
              originalThumbnailPath: record.originalThumbnailPath,
              createdAt: record.createdAt,
            },
          });
        count++;
      }
      return { success: true, count };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(
    "sync-section",
    async (_, { key, data }: { key: string; data: any[] }) => {
      try {
        // 1. IDリストを作成
        const itemIds = data.map((item) => normalizeId(item.id));

        // 2. セクションキャッシュを更新
        await db
          .insert(sectionCache)
          .values({
            key,
            itemIds: itemIds as any,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: sectionCache.key,
            set: {
              itemIds: itemIds as any,
              updatedAt: new Date(),
            },
          });

        return { success: true, count: itemIds.length };
      } catch (error: any) {
        console.error(`[Sync] Section ${key} Error:`, error);
        return { success: false, error: error.message };
      }
    }
  );

  ipcMain.handle(
    "get-section-data",
    async (
      _,
      { key, type }: { key: string; type: "songs" | "spotlights" | "playlists" }
    ) => {
      try {
        // 1. セクションキャッシュからIDリストを取得
        const cache = await db.query.sectionCache.findFirst({
          where: eq(sectionCache.key, key),
        });

        if (!cache || !cache.itemIds) {
          return [];
        }

        const itemIds = cache.itemIds as unknown as string[];
        if (itemIds.length === 0) return [];

        let results: any[] = [];
        let idMap = new Map<string, any>();

        // 2. タイプに応じてデータ取得
        if (type === "spotlights") {
          results = await db
            .select()
            .from(spotlights)
            .where(inArray(spotlights.id, itemIds));

          results.forEach((item) =>
            idMap.set(item.id, {
              id: item.id,
              title: item.title,
              author: item.author,
              description: item.description,
              genre: item.genre,
              video_path: item.originalVideoPath, // フロントエンドの型に合わせる
              thumbnail_path: item.originalThumbnailPath,
              local_video_path: item.videoPath || null,
              local_thumbnail_path: item.thumbnailPath || null,
              created_at: item.createdAt,
            })
          );
        } else if (type === "playlists") {
          results = await db
            .select()
            .from(playlists)
            .where(inArray(playlists.id, itemIds));

          results.forEach((p) =>
            idMap.set(p.id, {
              id: p.id,
              user_id: p.userId,
              title: p.title,
              image_path: p.imagePath,
              is_public: !!p.isPublic,
              created_at: p.createdAt,
            })
          );
        } else {
          // songs
          results = await db
            .select()
            .from(songs)
            .where(inArray(songs.id, itemIds));

          results.forEach((s) =>
            idMap.set(s.id, {
              id: s.id,
              user_id: s.userId,
              title: s.title,
              author: s.author,
              song_path: s.originalSongPath || null,
              image_path: s.originalImagePath || null,
              video_path: s.originalVideoPath || null,
              is_downloaded: !!s.songPath,
              local_song_path: s.songPath || null,
              local_image_path: s.imagePath || null,
              local_video_path: s.videoPath || null,
              duration: s.duration,
              genre: s.genre,
              count: "0",
              like_count: "0",
              lyrics: s.lyrics,
              created_at: s.createdAt || new Date().toISOString(),
            })
          );
        }

        // 3. 元のリスト順に並べ替え
        return itemIds
          .map((id) => idMap.get(id))
          .filter((item) => item !== undefined);
      } catch (error) {
        console.error(`[IPC] get-section-data(${key}) error:`, error);
        return [];
      }
    }
  );

  ipcMain.handle("debug-dump-db", async () => {
    try {
      const liked = await db.select().from(likedSongs).limit(10);
      const allSongs = await db.select().from(songs).limit(10);
      const joined = await db
        .select()
        .from(likedSongs)
        .leftJoin(
          songs,
          sql`CAST(${likedSongs.songId} AS TEXT) = CAST(${songs.id} AS TEXT)`
        )
        .limit(10);
      return { liked, allSongs, joined };
    } catch (error: any) {
      return { error: error.message };
    }
  });

  // --- Local-First Mutation Handlers ---

  /**
   * いいねを追加（ローカルDB）
   */
  ipcMain.handle(
    "add-liked-song",
    async (_, { userId, songId }: { userId: string; songId: string }) => {
      try {
        await db
          .insert(likedSongs)
          .values({
            userId: String(userId),
            songId: normalizeId(songId),
            likedAt: new Date().toISOString(),
          })
          .onConflictDoNothing();
        return { success: true };
      } catch (error: any) {
        console.error("[IPC] add-liked-song error:", error);
        return { success: false, error: error.message };
      }
    }
  );

  /**
   * いいねを削除（ローカルDB）
   */
  ipcMain.handle(
    "remove-liked-song",
    async (_, { userId, songId }: { userId: string; songId: string }) => {
      try {
        await db
          .delete(likedSongs)
          .where(
            sql`${likedSongs.userId} = ${String(userId)} AND ${
              likedSongs.songId
            } = ${normalizeId(songId)}`
          );
        return { success: true };
      } catch (error: any) {
        console.error("[IPC] remove-liked-song error:", error);
        return { success: false, error: error.message };
      }
    }
  );

  /**
   * いいね状態を取得（ローカルDB）
   */
  ipcMain.handle(
    "get-like-status",
    async (_, { userId, songId }: { userId: string; songId: string }) => {
      try {
        const result = await db.query.likedSongs.findFirst({
          where: sql`${likedSongs.userId} = ${String(userId)} AND ${
            likedSongs.songId
          } = ${normalizeId(songId)}`,
        });
        return { isLiked: !!result };
      } catch (error: any) {
        console.error("[IPC] get-like-status error:", error);
        return { isLiked: false, error: error.message };
      }
    }
  );

  /**
   * プレイリストに曲を追加（ローカルDB）
   */
  ipcMain.handle(
    "add-playlist-song",
    async (
      _,
      { playlistId, songId }: { playlistId: string; songId: string }
    ) => {
      try {
        const psId = `${normalizeId(playlistId)}_${normalizeId(songId)}`;
        await db
          .insert(playlistSongs)
          .values({
            id: psId,
            playlistId: normalizeId(playlistId),
            songId: normalizeId(songId),
            addedAt: new Date().toISOString(),
          })
          .onConflictDoNothing();
        return { success: true };
      } catch (error: any) {
        console.error("[IPC] add-playlist-song error:", error);
        return { success: false, error: error.message };
      }
    }
  );

  /**
   * プレイリストから曲を削除（ローカルDB）
   */
  ipcMain.handle(
    "remove-playlist-song",
    async (
      _,
      { playlistId, songId }: { playlistId: string; songId: string }
    ) => {
      try {
        await db
          .delete(playlistSongs)
          .where(
            sql`${playlistSongs.playlistId} = ${normalizeId(playlistId)} AND ${
              playlistSongs.songId
            } = ${normalizeId(songId)}`
          );
        return { success: true };
      } catch (error: any) {
        console.error("[IPC] remove-playlist-song error:", error);
        return { success: false, error: error.message };
      }
    }
  );
}
