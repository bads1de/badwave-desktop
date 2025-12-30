import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../../../electron/db/schema";
import { setupCacheHandlers } from "../../../electron/ipc/cache";

// Mock electron
const mockHandlers = new Map();
jest.mock("electron", () => ({
  ipcMain: {
    handle: (channel: string, listener: any) => {
      mockHandlers.set(channel, listener);
    },
  },
}));

// Mock db client
let testDb: any;
jest.mock("../../../electron/db/client", () => ({
  getDb: () => testDb,
}));

describe("Section Cache IPC", () => {
  let sqlite: any;

  beforeEach(() => {
    mockHandlers.clear();
    sqlite = new Database(":memory:");
    testDb = drizzle(sqlite, { schema });

    // Create tables manually matching schema
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS songs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        song_path TEXT,
        image_path TEXT,
        video_path TEXT,
        original_song_path TEXT,
        original_image_path TEXT,
        original_video_path TEXT,
        duration REAL,
        genre TEXT,
        lyrics TEXT,
        created_at TEXT,
        downloaded_at INTEGER,
        last_played_at INTEGER
      );
      CREATE TABLE IF NOT EXISTS spotlights (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        description TEXT,
        genre TEXT,
        original_video_path TEXT,
        original_thumbnail_path TEXT,
        video_path TEXT,
        thumbnail_path TEXT,
        created_at TEXT,
        downloaded_at INTEGER
      );
      CREATE TABLE IF NOT EXISTS section_cache (
        key TEXT PRIMARY KEY,
        item_ids TEXT, 
        updated_at INTEGER
      );
    `);

    setupCacheHandlers();
  });

  afterEach(() => {
    sqlite.close();
  });

  it("should sync and retrieve songs section correctly", async () => {
    const metaHandler = mockHandlers.get("sync-songs-metadata");
    const sectionHandler = mockHandlers.get("sync-section");
    const getHandler = mockHandlers.get("get-section-data");

    const songsData = [
      {
        id: "s1",
        user_id: "u1",
        title: "Song 1",
        author: "A1",
        created_at: "2023-01-01",
      },
      {
        id: "s2",
        user_id: "u1",
        title: "Song 2",
        author: "A2",
        created_at: "2023-01-02",
      },
    ];

    // 1. Sync Metadata
    await metaHandler(null, songsData);

    // 2. Sync Section
    await sectionHandler(null, { key: "test_songs", data: songsData });

    // 3. Get Data (songs)
    const result = await getHandler(null, { key: "test_songs", type: "songs" });

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("s1");
    expect(result[1].id).toBe("s2");
    expect(result[0].title).toBe("Song 1");
  });

  it("should sync and retrieve spotlights section correctly", async () => {
    const metaHandler = mockHandlers.get("sync-spotlights-metadata");
    const sectionHandler = mockHandlers.get("sync-section");
    const getHandler = mockHandlers.get("get-section-data");

    const spotlightData = [
      {
        id: "sp1",
        title: "Spotlight 1",
        author: "A1",
        video_path: "http://v1",
        created_at: "2023-01-01",
      },
    ];

    // 1. Sync Metadata
    await metaHandler(null, spotlightData);

    // 2. Sync Section
    await sectionHandler(null, { key: "test_spotlight", data: spotlightData });

    // 3. Get Data (spotlights)
    const result = await getHandler(null, {
      key: "test_spotlight",
      type: "spotlights",
    });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("sp1");
    expect(result[0].video_path).toBe("http://v1");
  });

  it("should sort data according to ID list order", async () => {
    const metaHandler = mockHandlers.get("sync-songs-metadata");
    const sectionHandler = mockHandlers.get("sync-section");
    const getHandler = mockHandlers.get("get-section-data");

    const songsData = [
      { id: "s1", title: "S1" },
      { id: "s2", title: "S2" },
      { id: "s3", title: "S3" },
    ];

    await metaHandler(null, songsData);

    // Sync section with order: s3, s1, s2
    const orderedData = [songsData[2], songsData[0], songsData[1]];
    await sectionHandler(null, { key: "ordered_songs", data: orderedData });

    const result = await getHandler(null, {
      key: "ordered_songs",
      type: "songs",
    });

    expect(result).toHaveLength(3);
    expect(result[0].id).toBe("s3");
    expect(result[1].id).toBe("s1");
    expect(result[2].id).toBe("s2");
  });
});
