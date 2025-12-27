import { ipcMain, app } from "electron";
import fs from "fs";
import path from "path";
import https from "https";
import { debugLog } from "../utils";
import { getDb } from "../db/client";
import { songs } from "../db/schema";
import { eq, isNotNull } from "drizzle-orm";

// Define the Song type compatible with our schema (or import from shared types if valid)
// For now, let's use 'any' for the incoming song object to avoid strict typing issues during IPC,
// but we should validate fields.
interface SongDownloadPayload {
  id: string;
  userId: string;
  title: string;
  author: string;
  song_path: string; // The remote URL
  image_path: string; // The remote URL
  duration?: number;
  genre?: string;
  lyrics?: string;
  created_at: string;
}

export const setupDownloadHandlers = () => {
  const db = getDb();

  // Handle song download request
  ipcMain.handle("download-song", async (event, song: SongDownloadPayload) => {
    const songId = song.id;
    debugLog(`[IPC] download-song request for: ${song.title} (${songId})`);

    try {
      // 1. Prepare Paths
      const userDataPath = app.getPath("userData");
      const offlineDir = path.join(userDataPath, "offline_storage");
      const songsDir = path.join(offlineDir, "songs");
      const imagesDir = path.join(offlineDir, "images");

      // Ensure directories exist
      await fs.promises.mkdir(songsDir, { recursive: true });
      await fs.promises.mkdir(imagesDir, { recursive: true });

      // Local file paths
      const localSongFilename = `${songId}.mp3`;
      const localImageFilename = `${songId}.jpg`; // Assuming jpg for now, ideally detect ext

      const localSongPath = path.join(songsDir, localSongFilename);
      const localImagePath = path.join(imagesDir, localImageFilename);

      // 2. Download Files
      // Helper function to download a file
      const downloadFile = (url: string, dest: string) => {
        return new Promise<void>((resolve, reject) => {
          const file = fs.createWriteStream(dest);
          https
            .get(url, (response) => {
              if (response.statusCode !== 200) {
                fs.unlink(dest, () => {});
                reject(
                  new Error(
                    `Download failed with status code: ${response.statusCode}`
                  )
                );
                return;
              }
              response.pipe(file);
              file.on("finish", () => {
                file.close(() => resolve());
              });
            })
            .on("error", (err) => {
              fs.unlink(dest, () => {});
              reject(err);
            });
        });
      };

      // Perform downloads
      const downloadConfig = [];
      if (song.song_path) {
        downloadConfig.push(downloadFile(song.song_path, localSongPath));
      }
      if (song.image_path) {
        downloadConfig.push(downloadFile(song.image_path, localImagePath));
      }

      await Promise.all(downloadConfig);
      debugLog(`[IPC] Files downloaded for: ${songId}`);

      // 3. Upsert Metadata to SQLite
      // We map the incoming song object to our schema
      const songRecord = {
        id: song.id,
        userId: song.userId,
        title: song.title,
        author: song.author,

        // Local paths (protocol format)
        songPath: `file://${localSongPath}`,
        imagePath: `file://${localImagePath}`,

        // Original URLs (for reference)
        originalSongPath: song.song_path,
        originalImagePath: song.image_path,

        duration: song.duration,
        genre: song.genre,
        lyrics: song.lyrics,

        createdAt: song.created_at,
        downloadedAt: new Date(), // Set current time
      };

      await db.insert(songs).values(songRecord).onConflictDoUpdate({
        target: songs.id,
        set: songRecord, // Update everything if exists
      });

      debugLog(`[IPC] Database updated for: ${songId}`);

      return { success: true, localPath: songRecord.songPath };
    } catch (error: any) {
      debugLog(`[IPC] Download failed for ${songId}:`, error);
      return { success: false, error: error.message };
    }
  });

  // Check offline status
  ipcMain.handle("check-offline-status", async (_, songId: string) => {
    try {
      const result = await db.query.songs.findFirst({
        where: eq(songs.id, songId),
        columns: {
          songPath: true,
        },
      });

      // It is downloaded if the record exists AND songPath is not null
      const isDownloaded = !!(result && result.songPath);
      return {
        isDownloaded,
        localPath: result?.songPath || undefined,
      };
    } catch (error) {
      console.error("Failed to check offline status:", error);
      return { isDownloaded: false };
    }
  });

  // Get all offline (downloaded) songs
  ipcMain.handle("get-offline-songs", async () => {
    debugLog("[IPC] get-offline-songs request");

    try {
      // Return only songs that have been downloaded (songPath is not null)
      const offlineSongs = await db.query.songs.findMany({
        where: isNotNull(songs.songPath),
      });

      debugLog(`[IPC] Found ${offlineSongs.length} offline songs`);

      // Transform to match the Song type expected by the renderer
      return offlineSongs.map((song) => ({
        id: song.id,
        user_id: song.userId,
        title: song.title,
        author: song.author,
        song_path: song.songPath, // Local file path
        image_path: song.imagePath,
        original_song_path: song.originalSongPath,
        original_image_path: song.originalImagePath,
        duration: song.duration,
        genre: song.genre,
        lyrics: song.lyrics,
        created_at: song.createdAt,
        downloaded_at: song.downloadedAt,
      }));
    } catch (error: any) {
      console.error("[IPC] Failed to get offline songs:", error);
      return [];
    }
  });

  // Delete offline song (remove files and DB record)
  ipcMain.handle("delete-offline-song", async (_, songId: string) => {
    debugLog(`[IPC] delete-offline-song request for: ${songId}`);

    try {
      // 1. Get the song record to find file paths
      const songRecord = await db.query.songs.findFirst({
        where: eq(songs.id, songId),
      });

      if (!songRecord) {
        debugLog(`[IPC] Song not found in DB: ${songId}`);
        return { success: false, error: "Song not found" };
      }

      // 2. Delete files if they exist
      const filesToDelete: string[] = [];

      if (songRecord.songPath) {
        // Convert file:// URL to local path
        const localSongPath = songRecord.songPath.replace("file://", "");
        filesToDelete.push(localSongPath);
      }

      if (songRecord.imagePath) {
        const localImagePath = songRecord.imagePath.replace("file://", "");
        filesToDelete.push(localImagePath);
      }

      // Delete files (ignore errors if file doesn't exist)
      for (const filePath of filesToDelete) {
        try {
          await fs.promises.unlink(filePath);
          debugLog(`[IPC] Deleted file: ${filePath}`);
        } catch (err: any) {
          if (err.code !== "ENOENT") {
            // Log but don't fail if file doesn't exist
            debugLog(`[IPC] Warning: Could not delete file: ${filePath}`, err);
          }
        }
      }

      // 3. Delete from database
      await db.delete(songs).where(eq(songs.id, songId));
      debugLog(`[IPC] Deleted song from DB: ${songId}`);

      return { success: true };
    } catch (error: any) {
      console.error(`[IPC] Failed to delete offline song ${songId}:`, error);
      return { success: false, error: error.message };
    }
  });
};
