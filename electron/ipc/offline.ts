import { ipcMain, app } from "electron";
import fs from "fs";
import path from "path";
import https from "https";
import { debugLog } from "../utils";
import { getDb } from "../db/client";
import { songs } from "../db/schema";
import { eq } from "drizzle-orm";

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
      return isDownloaded;
    } catch (error) {
      console.error("Failed to check offline status:", error);
      return false;
    }
  });
};
