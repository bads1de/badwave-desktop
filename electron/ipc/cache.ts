import { ipcMain } from "electron";
import { getDb } from "../db/client";
import { songs, playlists, playlistSongs, likedSongs } from "../db/schema";
import { eq, sql } from "drizzle-orm";

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
        columns: { songPath: true, imagePath: true, downloadedAt: true },
      });

      const record = {
        id: songId,
        userId: String(song.user_id || ""),
        title: String(song.title || "Unknown Title"),
        author: String(song.author || "Unknown Author"),
        songPath: existing?.songPath ?? null,
        imagePath: existing?.imagePath ?? null,
        originalSongPath: song.song_path,
        originalImagePath: song.image_path,
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
        await db.transaction(async (tx) => {
          for (const songData of fullSongsData) {
            await tx
              .insert(likedSongs)
              .values({
                userId: String(userId),
                songId: normalizeId(songData.id),
                likedAt: songData.created_at || new Date().toISOString(),
              })
              .onConflictDoNothing();
          }
        });
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
          is_downloaded: !!song?.songPath,
          local_song_path: song?.songPath || null,
          local_image_path: song?.imagePath || null,
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
          is_downloaded: !!song?.songPath,
          local_song_path: song?.songPath || null,
          local_image_path: song?.imagePath || null,
          created_at: playlist_songs.addedAt,
        };
      });
    } catch (error) {
      return [];
    }
  });

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
}
