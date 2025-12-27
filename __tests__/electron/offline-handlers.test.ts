import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { eq, isNotNull } from "drizzle-orm";
import * as schema from "../../electron/db/schema";
import path from "path";

/**
 * オフラインIPCハンドラーのテスト
 *
 * このテストはIPCハンドラーの内部ロジック（DB操作）をテストします。
 * 実際のIPCはElectron環境でのみ動作するため、ここではDB操作のみをテストします。
 */
describe("Offline IPC Handlers - DB Operations", () => {
  let sqlite: Database.Database;
  let db: ReturnType<typeof drizzle<typeof schema>>;

  // テストデータ
  const testSong1 = {
    id: "offline-song-1",
    userId: "user-123",
    title: "Downloaded Song 1",
    author: "Artist 1",
    songPath: "file://C:/Users/test/offline_storage/songs/offline-song-1.mp3",
    imagePath: "file://C:/Users/test/offline_storage/images/offline-song-1.jpg",
    originalSongPath: "https://supabase.co/storage/songs/song1.mp3",
    originalImagePath: "https://supabase.co/storage/images/song1.jpg",
    duration: 180,
    genre: "Pop",
    lyrics: "Test lyrics 1",
    createdAt: new Date().toISOString(),
    downloadedAt: new Date(),
  };

  const testSong2 = {
    id: "offline-song-2",
    userId: "user-123",
    title: "Downloaded Song 2",
    author: "Artist 2",
    songPath: "file://C:/Users/test/offline_storage/songs/offline-song-2.mp3",
    imagePath: "file://C:/Users/test/offline_storage/images/offline-song-2.jpg",
    originalSongPath: "https://supabase.co/storage/songs/song2.mp3",
    originalImagePath: "https://supabase.co/storage/images/song2.jpg",
    duration: 240,
    genre: "Rock",
    lyrics: "Test lyrics 2",
    createdAt: new Date().toISOString(),
    downloadedAt: new Date(),
  };

  const testSongNotDownloaded = {
    id: "online-song-1",
    userId: "user-123",
    title: "Online Only Song",
    author: "Artist 3",
    songPath: null, // ダウンロードされていない
    imagePath: null,
    originalSongPath: "https://supabase.co/storage/songs/song3.mp3",
    originalImagePath: "https://supabase.co/storage/images/song3.jpg",
    duration: 200,
    genre: "Jazz",
    lyrics: null,
    createdAt: new Date().toISOString(),
    downloadedAt: null,
  };

  beforeAll(() => {
    // インメモリデータベースを作成
    sqlite = new Database(":memory:");
    db = drizzle(sqlite, { schema });

    // マイグレーションを実行
    const migrationsFolder = path.join(__dirname, "../../drizzle");
    migrate(db, { migrationsFolder });
  });

  beforeEach(async () => {
    // 各テスト前にテーブルをクリア
    await db.delete(schema.songs);

    // テストデータを挿入
    await db
      .insert(schema.songs)
      .values([testSong1, testSong2, testSongNotDownloaded]);
  });

  afterAll(() => {
    sqlite.close();
  });

  describe("get-offline-songs", () => {
    test("should return only downloaded songs (songs with songPath)", async () => {
      // ダウンロード済みの曲のみを取得するクエリ
      const offlineSongs = await db.query.songs.findMany({
        where: isNotNull(schema.songs.songPath),
      });

      expect(offlineSongs).toHaveLength(2);
      expect(offlineSongs.map((s) => s.id)).toContain("offline-song-1");
      expect(offlineSongs.map((s) => s.id)).toContain("offline-song-2");
      expect(offlineSongs.map((s) => s.id)).not.toContain("online-song-1");
    });

    test("should return songs with all metadata fields", async () => {
      const offlineSongs = await db.query.songs.findMany({
        where: isNotNull(schema.songs.songPath),
      });

      const song1 = offlineSongs.find((s) => s.id === "offline-song-1");
      expect(song1).toBeDefined();
      expect(song1?.title).toBe("Downloaded Song 1");
      expect(song1?.author).toBe("Artist 1");
      expect(song1?.duration).toBe(180);
      expect(song1?.genre).toBe("Pop");
      expect(song1?.lyrics).toBe("Test lyrics 1");
      expect(song1?.songPath).toContain("file://");
      expect(song1?.imagePath).toContain("file://");
    });

    test("should return empty array when no songs are downloaded", async () => {
      // すべてのダウンロード済み曲を削除
      await db.delete(schema.songs);
      await db.insert(schema.songs).values(testSongNotDownloaded);

      const offlineSongs = await db.query.songs.findMany({
        where: isNotNull(schema.songs.songPath),
      });

      expect(offlineSongs).toHaveLength(0);
    });
  });

  describe("delete-offline-song", () => {
    test("should delete song from database", async () => {
      const songIdToDelete = "offline-song-1";

      // 削除前に存在確認
      const beforeDelete = await db.query.songs.findFirst({
        where: eq(schema.songs.id, songIdToDelete),
      });
      expect(beforeDelete).toBeDefined();

      // 削除実行
      await db.delete(schema.songs).where(eq(schema.songs.id, songIdToDelete));

      // 削除後に存在しないことを確認
      const afterDelete = await db.query.songs.findFirst({
        where: eq(schema.songs.id, songIdToDelete),
      });
      expect(afterDelete).toBeUndefined();
    });

    test("should not affect other songs when deleting one", async () => {
      const songIdToDelete = "offline-song-1";

      // 削除実行
      await db.delete(schema.songs).where(eq(schema.songs.id, songIdToDelete));

      // 他の曲が残っていることを確認
      const remainingSongs = await db.query.songs.findMany();
      expect(remainingSongs).toHaveLength(2);
      expect(remainingSongs.map((s) => s.id)).toContain("offline-song-2");
      expect(remainingSongs.map((s) => s.id)).toContain("online-song-1");
    });

    test("should return no error when deleting non-existent song", async () => {
      const nonExistentId = "non-existent-song";

      // 存在しない曲の削除は例外を投げない
      await expect(
        db.delete(schema.songs).where(eq(schema.songs.id, nonExistentId))
      ).resolves.not.toThrow();
    });
  });

  describe("check-offline-status", () => {
    test("should return true for downloaded song", async () => {
      const result = await db.query.songs.findFirst({
        where: eq(schema.songs.id, "offline-song-1"),
        columns: { songPath: true },
      });

      const isDownloaded = !!(result && result.songPath);
      expect(isDownloaded).toBe(true);
    });

    test("should return false for non-downloaded song", async () => {
      const result = await db.query.songs.findFirst({
        where: eq(schema.songs.id, "online-song-1"),
        columns: { songPath: true },
      });

      const isDownloaded = !!(result && result.songPath);
      expect(isDownloaded).toBe(false);
    });

    test("should return false for non-existent song", async () => {
      const result = await db.query.songs.findFirst({
        where: eq(schema.songs.id, "non-existent-id"),
        columns: { songPath: true },
      });

      const isDownloaded = !!(result && result.songPath);
      expect(isDownloaded).toBe(false);
    });
  });

  describe("download-song (upsert behavior)", () => {
    test("should insert new song when downloading", async () => {
      const newSong = {
        id: "new-offline-song",
        userId: "user-123",
        title: "New Downloaded Song",
        author: "New Artist",
        songPath: "file://C:/Users/test/offline_storage/songs/new-song.mp3",
        imagePath: "file://C:/Users/test/offline_storage/images/new-song.jpg",
        originalSongPath: "https://supabase.co/storage/songs/new.mp3",
        originalImagePath: "https://supabase.co/storage/images/new.jpg",
        duration: 300,
        genre: "Electronic",
        lyrics: "New lyrics",
        createdAt: new Date().toISOString(),
        downloadedAt: new Date(),
      };

      await db.insert(schema.songs).values(newSong).onConflictDoUpdate({
        target: schema.songs.id,
        set: newSong,
      });

      const inserted = await db.query.songs.findFirst({
        where: eq(schema.songs.id, "new-offline-song"),
      });

      expect(inserted).toBeDefined();
      expect(inserted?.title).toBe("New Downloaded Song");
      expect(inserted?.songPath).toContain("file://");
    });

    test("should update existing song when re-downloading", async () => {
      const updatedSong = {
        ...testSong1,
        title: "Updated Title",
        downloadedAt: new Date(),
      };

      await db.insert(schema.songs).values(updatedSong).onConflictDoUpdate({
        target: schema.songs.id,
        set: updatedSong,
      });

      const updated = await db.query.songs.findFirst({
        where: eq(schema.songs.id, "offline-song-1"),
      });

      expect(updated).toBeDefined();
      expect(updated?.title).toBe("Updated Title");
    });
  });
});
