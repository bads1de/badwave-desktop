import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { eq } from "drizzle-orm";
import * as schema from "../electron/db/schema";
import path from "path";

describe("Database Schema Tests", () => {
  let sqlite: Database.Database;
  let db: ReturnType<typeof drizzle<typeof schema>>;

  beforeAll(() => {
    // 1. Create an in-memory database
    sqlite = new Database(":memory:");
    db = drizzle(sqlite, { schema });

    // 2. Run migrations
    const migrationsFolder = path.join(__dirname, "../drizzle");
    migrate(db, { migrationsFolder });
  });

  afterAll(() => {
    sqlite.close();
  });

  test("should insert and retrieve a song", async () => {
    const newSong = {
      id: "test-song-uuid-1",
      userId: "user-123",
      title: "Test Song",
      author: "Test Artist",
      songPath: "file://path/to/song.mp3",
      createdAt: new Date().toISOString(),
    };

    await db.insert(schema.songs).values(newSong);

    const fetchedSong = await db.query.songs.findFirst({
      where: (songs, { eq }) => eq(songs.id, "test-song-uuid-1"),
    });

    expect(fetchedSong).toBeDefined();
    expect(fetchedSong?.title).toBe("Test Song");
  });

  test("should handle playlist relations", async () => {
    const newPlaylist = {
      id: "playlist-uuid-1",
      userId: "user-123",
      title: "My Offline Playlist",
      createdAt: new Date().toISOString(),
    };
    await db.insert(schema.playlists).values(newPlaylist);

    await db.insert(schema.playlistSongs).values({
      id: "link-1",
      playlistId: "playlist-uuid-1",
      songId: "test-song-uuid-1", // Using the song inserted in the previous test
      addedAt: new Date().toISOString(),
    });

    const joined = await db
      .select()
      .from(schema.playlistSongs)
      .innerJoin(schema.songs, eq(schema.songs.id, schema.playlistSongs.songId))
      .where(eq(schema.playlistSongs.playlistId, "playlist-uuid-1"));

    expect(joined.length).toBeGreaterThan(0);
    expect(joined[0].songs.title).toBe("Test Song");
  });
});
