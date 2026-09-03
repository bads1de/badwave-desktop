import {
  idSchema,
  filenameSchema,
  filePathSchema,
  externalUrlSchema,
  authUrlSchema,
  storeKeySchema,
  storeValueSchema,
  songDownloadPayloadSchema,
  cachedUserSchema,
  likedSongInputSchema,
  playlistSongInputSchema,
  transcribeInputSchema,
  validateInput,
} from "@/electron/lib/ipc-validate";

describe("electron/lib/ipc-validate", () => {
  describe("idSchema", () => {
    it("should accept valid IDs", () => {
      expect(idSchema.parse("abc123")).toBe("abc123");
      expect(idSchema.parse("user_123-456:abc")).toBe("user_123-456:abc");
      expect(idSchema.parse("a")).toBe("a");
    });

    it("should reject empty string", () => {
      expect(() => idSchema.parse("")).toThrow();
    });

    it("should reject IDs with invalid characters", () => {
      expect(() => idSchema.parse("hello world")).toThrow();
      expect(() => idSchema.parse("test@id")).toThrow();
      expect(() => idSchema.parse("id/123")).toThrow();
    });

    it("should reject IDs exceeding max length", () => {
      expect(() => idSchema.parse("a".repeat(65))).toThrow();
    });
  });

  describe("filenameSchema", () => {
    it("should accept valid filenames", () => {
      expect(filenameSchema.parse("song.mp3")).toBe("song.mp3");
      expect(filenameSchema.parse("my-file_v2.txt")).toBe("my-file_v2.txt");
    });

    it("should reject path separators", () => {
      expect(() => filenameSchema.parse("../file.txt")).toThrow();
      expect(() => filenameSchema.parse("dir/file.txt")).toThrow();
    });

    it("should reject . and ..", () => {
      expect(() => filenameSchema.parse(".")).toThrow();
      expect(() => filenameSchema.parse("..")).toThrow();
    });
  });

  describe("filePathSchema", () => {
    it("should accept Windows absolute paths", () => {
      expect(filePathSchema.parse("C:\\Users\\test\\song.mp3")).toBe(
        "C:\\Users\\test\\song.mp3",
      );
      expect(filePathSchema.parse("D:/music/song.mp3")).toBe(
        "D:/music/song.mp3",
      );
    });

    it("should accept Unix absolute paths", () => {
      expect(filePathSchema.parse("/home/user/song.mp3")).toBe(
        "/home/user/song.mp3",
      );
    });

    it("should reject relative paths", () => {
      expect(() => filePathSchema.parse("relative/path.mp3")).toThrow();
      expect(() => filePathSchema.parse("file.txt")).toThrow();
    });
  });

  describe("externalUrlSchema", () => {
    it("should accept http and https URLs", () => {
      expect(externalUrlSchema.parse("https://example.com")).toBe(
        "https://example.com",
      );
      expect(externalUrlSchema.parse("http://localhost:3000")).toBe(
        "http://localhost:3000",
      );
    });

    it("should reject non-http protocols", () => {
      expect(() => externalUrlSchema.parse("javascript:alert(1)")).toThrow();
      expect(() => externalUrlSchema.parse("ftp://example.com")).toThrow();
      expect(() => externalUrlSchema.parse("file:///etc/passwd")).toThrow();
    });
  });

  describe("authUrlSchema", () => {
    it("should accept supabase callback URLs", () => {
      expect(
        authUrlSchema.parse(
          "https://project.supabase.co/auth/v1/callback",
        ),
      ).toBe("https://project.supabase.co/auth/v1/callback");
    });

    it("should accept google accounts URL", () => {
      expect(
        authUrlSchema.parse(
          "https://accounts.google.com/o/oauth2/auth",
        ),
      ).toBe("https://accounts.google.com/o/oauth2/auth");
    });

    it("should accept URLs with /auth/callback in path", () => {
      expect(
        authUrlSchema.parse("http://localhost:3000/auth/callback"),
      ).toBe("http://localhost:3000/auth/callback");
    });

    it("should reject arbitrary URLs", () => {
      expect(() =>
        authUrlSchema.parse("https://evil.com/steal"),
      ).toThrow();
    });
  });

  describe("storeKeySchema", () => {
    it("should accept valid keys", () => {
      expect(storeKeySchema.parse("player_volume")).toBe("player_volume");
      expect(storeKeySchema.parse("right-sidebar.closed")).toBe(
        "right-sidebar.closed",
      );
    });

    it("should reject keys with invalid characters", () => {
      expect(() => storeKeySchema.parse("key with spaces")).toThrow();
      expect(() => storeKeySchema.parse("key/slash")).toThrow();
    });
  });

  describe("storeValueSchema", () => {
    it("should accept strings", () => {
      expect(storeValueSchema.parse("hello")).toBe("hello");
    });

    it("should accept numbers", () => {
      expect(storeValueSchema.parse(42)).toBe(42);
      expect(storeValueSchema.parse(3.14)).toBe(3.14);
    });

    it("should accept booleans", () => {
      expect(storeValueSchema.parse(true)).toBe(true);
      expect(storeValueSchema.parse(false)).toBe(false);
    });

    it("should accept null", () => {
      expect(storeValueSchema.parse(null)).toBe(null);
    });

    it("should reject NaN and Infinity", () => {
      expect(() => storeValueSchema.parse(NaN)).toThrow();
      expect(() => storeValueSchema.parse(Infinity)).toThrow();
    });
  });

  describe("songDownloadPayloadSchema", () => {
    const validPayload = {
      id: "song-123",
      userId: "user-456",
      title: "Test Song",
      author: "Test Artist",
      song_path: "https://example.com/song.mp3",
      image_path: "https://example.com/cover.jpg",
      created_at: "2024-01-01T00:00:00Z",
    };

    it("should accept valid download payload", () => {
      const result = songDownloadPayloadSchema.parse(validPayload);
      expect(result.id).toBe("song-123");
      expect(result.title).toBe("Test Song");
    });

    it("should reject payload with missing fields", () => {
      expect(() =>
        songDownloadPayloadSchema.parse({ id: "123" }),
      ).toThrow();
    });

    it("should accept a valid payload without image_path (image is optional)", () => {
      const payload = {
        id: "song-123",
        userId: "user-456",
        title: "Test Song",
        author: "Test Artist",
        song_path: "https://example.com/song.mp3",
        created_at: "2024-01-01T00:00:00Z",
      };
      const result = songDownloadPayloadSchema.parse(payload);
      expect(result.id).toBe("song-123");
      expect(result.image_path).toBeUndefined();
    });

    it("should treat an empty image_path as valid", () => {
      const payload = {
        id: "song-123",
        userId: "user-456",
        title: "Test Song",
        author: "Test Artist",
        song_path: "https://example.com/song.mp3",
        image_path: "",
        created_at: "2024-01-01T00:00:00Z",
      };
      const result = songDownloadPayloadSchema.parse(payload);
      expect(result.image_path).toBe("");
    });
  });

  describe("cachedUserSchema", () => {
    it("should accept valid cached user", () => {
      const result = cachedUserSchema.parse({
        id: "user-1",
        email: "test@example.com",
      });
      expect(result.id).toBe("user-1");
    });

    it("should reject invalid email", () => {
      expect(() =>
        cachedUserSchema.parse({ id: "user-1", email: "not-an-email" }),
      ).toThrow();
    });
  });

  describe("likedSongInputSchema", () => {
    it("should accept valid input", () => {
      const result = likedSongInputSchema.parse({
        userId: "user-1",
        songId: "song-1",
      });
      expect(result.userId).toBe("user-1");
      expect(result.songId).toBe("song-1");
    });

    it("should reject missing fields", () => {
      expect(() => likedSongInputSchema.parse({})).toThrow();
    });
  });

  describe("playlistSongInputSchema", () => {
    it("should accept valid input", () => {
      const result = playlistSongInputSchema.parse({
        playlistId: "playlist-1",
        songId: "song-1",
      });
      expect(result.playlistId).toBe("playlist-1");
    });
  });

  describe("transcribeInputSchema", () => {
    it("should accept tuple form", () => {
      const result = transcribeInputSchema.parse([
        "https://example.com/audio.mp3",
        "lyrics text",
      ]);
      if (!Array.isArray(result)) throw new Error("Expected tuple form");
      expect(result[0]).toBe("https://example.com/audio.mp3");
      expect(result[1]).toBe("lyrics text");
    });

    it("should accept object form", () => {
      const result = transcribeInputSchema.parse({
        audioPath: "https://example.com/audio.mp3",
        lyricsText: "lyrics text",
      });
      if (Array.isArray(result)) throw new Error("Expected object form");
      expect(result.audioPath).toBe("https://example.com/audio.mp3");
    });
  });

  describe("validateInput", () => {
    it("should return validated data on success", () => {
      const result = validateInput(idSchema, "abc123", "test-channel");
      expect(result).toBe("abc123");
    });

    it("should throw on validation failure", () => {
      expect(() =>
        validateInput(idSchema, "", "test-channel"),
      ).toThrow("[IPC:test-channel]");
    });
  });
});
