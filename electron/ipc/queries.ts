import { CHANNELS } from "../channels";
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
import { mapDbSongToResponse, createUnknownSongFallback, normalizeId } from "../utils";
import { SectionItem } from "../../types/local";
import { getErrorMessage } from "../lib/error";

export function setupQueryHandlers() {
  const db = getDb();

  ipcMain.handle(CHANNELS.GET_CACHED_LIKED_SONGS, async (_, userId: string) => {
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
        if (!song) {
          return createUnknownSongFallback(
            liked_songs.songId,
            liked_songs.userId,
            liked_songs.likedAt,
          );
        }
        return mapDbSongToResponse(song, {
          created_at: liked_songs.likedAt,
          user_id: liked_songs.userId,
        });
      });
    } catch (error) {
      console.error("[IPC] get-cached-liked-songs error:", error);
      return [];
    }
  });

  ipcMain.handle(CHANNELS.GET_CACHED_PLAYLISTS, async (_, userId: string) => {
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

  ipcMain.handle(CHANNELS.GET_CACHED_PLAYLIST_SONGS, async (_, playlistId: string) => {
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
        if (!song) {
          return createUnknownSongFallback(
            playlist_songs.songId,
            "",
            playlist_songs.addedAt,
          );
        }
        return mapDbSongToResponse(song, {
          created_at: playlist_songs.addedAt,
        });
      });
    } catch (error) {
      return [];
    }
  });

  ipcMain.handle(
    CHANNELS.GET_SECTION_DATA,
    async (
      _,
      { key, type }: { key: string; type: "songs" | "spotlights" | "playlists" }
    ) => {
      try {
        const cache = await db.query.sectionCache.findFirst({
          where: eq(sectionCache.key, key),
        });

        if (!cache || !cache.itemIds) {
          return [];
        }

        const itemIds = cache.itemIds as unknown as string[];
        if (itemIds.length === 0) return [];

        let results: Record<string, unknown>[] = [];
        let idMap = new Map<string, SectionItem>();

        if (type === "spotlights") {
          results = await db
            .select()
            .from(spotlights)
            .where(inArray(spotlights.id, itemIds));

          results.forEach((item) =>
            idMap.set(item.id as string, {
              id: item.id as string,
              title: item.title as string,
              author: item.author as string,
              description: item.description as string | null,
              genre: item.genre as string | null,
              video_path: item.originalVideoPath as string | null,
              thumbnail_path: item.originalThumbnailPath as string | null,
              local_video_path: item.videoPath as string | null,
              local_thumbnail_path: item.thumbnailPath as string | null,
              created_at: item.createdAt as string | null,
            })
          );
        } else if (type === "playlists") {
          results = await db
            .select()
            .from(playlists)
            .where(inArray(playlists.id, itemIds));

          results.forEach((p) =>
            idMap.set(p.id as string, {
              id: p.id as string,
              user_id: p.userId as string,
              title: p.title as string,
              image_path: p.imagePath as string | undefined,
              is_public: !!p.isPublic,
              created_at: p.createdAt as string | null,
            })
          );
        } else {
          results = await db
            .select()
            .from(songs)
            .where(inArray(songs.id, itemIds));

          results.forEach((s) => {
            const song = mapDbSongToResponse(s as unknown as import("../../types/local").DbSongRow);
            idMap.set(s.id as string, song as unknown as SectionItem);
          });
        }

        return itemIds
          .map((id) => idMap.get(id))
          .filter((item) => item !== undefined);
      } catch (error) {
        console.error(`[IPC] get-section-data(${key}) error:`, error);
        return [];
      }
    }
  );

  ipcMain.handle(
    CHANNELS.GET_SONGS_PAGINATED,
    async (_, { offset, limit }: { offset: number; limit: number }) => {
      try {
        const results = await db
          .select()
          .from(songs)
          .orderBy(sql`${songs.createdAt} DESC`)
          .limit(limit)
          .offset(offset);

        return results.map((s) => mapDbSongToResponse(s));
      } catch (error) {
        console.error("[IPC] get-songs-paginated error:", error);
        return [];
      }
    }
  );

  ipcMain.handle(CHANNELS.GET_SONGS_TOTAL_COUNT, async () => {
    try {
      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(songs);
      return result[0]?.count || 0;
    } catch (error) {
      console.error("[IPC] get-songs-total-count error:", error);
      return 0;
    }
  });

  ipcMain.handle(CHANNELS.DEBUG_DUMP_DB, async () => {
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
    } catch (error: unknown) {
      return { error: getErrorMessage(error) };
    }
  });

  ipcMain.handle(CHANNELS.GET_SONG_BY_ID, async (_, songId: string) => {
    try {
      const normalizedId = normalizeId(songId);
      const song = await db.query.songs.findFirst({
        where: eq(songs.id, normalizedId),
      });

      if (!song) {
        return null;
      }

      return mapDbSongToResponse(song);
    } catch (error) {
      console.error(`[IPC] get-song-by-id(${songId}) error:`, error);
      return null;
    }
  });

  ipcMain.handle(CHANNELS.GET_PLAYLIST_BY_ID, async (_, playlistId: string) => {
    try {
      const normalizedId = normalizeId(playlistId);
      const playlist = await db.query.playlists.findFirst({
        where: eq(playlists.id, normalizedId),
      });

      if (!playlist) {
        return null;
      }

      return {
        id: playlist.id,
        user_id: playlist.userId,
        title: playlist.title,
        image_path: playlist.imagePath || undefined,
        is_public: !!playlist.isPublic,
        created_at: playlist.createdAt,
      };
    } catch (error) {
      console.error(`[IPC] get-playlist-by-id(${playlistId}) error:`, error);
      return null;
    }
  });
}
