import {
  SUPPORTED_AUDIO_EXTENSIONS,
  videoIds,
  genres,
  CACHE_PREFIX,
  CACHED_QUERIES,
  ELECTRON_STORE_KEYS,
  CACHE_CONFIG,
  PROTECTED_ROUTES,
  TABLES,
  DURATIONS,
  SPRING_SIDEBAR,
  ROUTES,
} from "@/constants/index";

describe("constants/index", () => {
  describe("SUPPORTED_AUDIO_EXTENSIONS", () => {
    it("should contain common audio extensions", () => {
      expect(SUPPORTED_AUDIO_EXTENSIONS).toContain(".mp3");
      expect(SUPPORTED_AUDIO_EXTENSIONS).toContain(".wav");
      expect(SUPPORTED_AUDIO_EXTENSIONS).toContain(".flac");
      expect(SUPPORTED_AUDIO_EXTENSIONS).toContain(".ogg");
    });
  });

  describe("videoIds", () => {
    it("should have 5 entries with valid structure", () => {
      expect(videoIds).toHaveLength(5);
      videoIds.forEach((v) => {
        expect(v).toHaveProperty("id");
        expect(v).toHaveProperty("name");
        expect(v).toHaveProperty("videoId");
      });
    });
  });

  describe("genres", () => {
    it("should contain expected genres", () => {
      const names = genres.map((g) => g.name);
      expect(names).toContain("J-Pop");
      expect(names).toContain("Synth Wave");
      expect(names).toContain("City Pop");
      expect(names).toContain("Vapor Wave");
    });

    it("each genre should have id and name", () => {
      genres.forEach((g) => {
        expect(typeof g.id).toBe("string");
        expect(typeof g.name).toBe("string");
      });
    });
  });

  describe("CACHE_PREFIX", () => {
    it("should be @query-cache", () => {
      expect(CACHE_PREFIX).toBe("@query-cache");
    });
  });

  describe("CACHED_QUERIES", () => {
    it("should have all expected keys", () => {
      expect(CACHED_QUERIES.media).toBe("media");
      expect(CACHED_QUERIES.songUrl).toBe("songUrl");
      expect(CACHED_QUERIES.playlists).toBe("playlists");
      expect(CACHED_QUERIES.likedSongs).toBe("likedSongs");
      expect(CACHED_QUERIES.spotlight).toBe("spotlight");
      expect(CACHED_QUERIES.playlistSongStatus).toBe("playlistSongStatus");
    });
  });

  describe("ELECTRON_STORE_KEYS", () => {
    it("should have player volume key", () => {
      expect(ELECTRON_STORE_KEYS.VOLUME).toBe("player_volume");
    });
  });

  describe("CACHE_CONFIG", () => {
    it("should have staleTime and gcTime", () => {
      expect(CACHE_CONFIG.staleTime).toBe(600000);
      expect(CACHE_CONFIG.gcTime).toBe(1800000);
    });
  });

  describe("PROTECTED_ROUTES", () => {
    it("should protect /account and /liked", () => {
      expect(PROTECTED_ROUTES).toContain("/account");
      expect(PROTECTED_ROUTES).toContain("/liked");
    });
  });

  describe("TABLES", () => {
    it("should reference expected table names", () => {
      expect(TABLES.SONGS).toBe("songs");
      expect(TABLES.PLAYLISTS).toBe("playlists");
      expect(TABLES.USERS).toBe("users");
    });
  });

  describe("DURATIONS", () => {
    it("should have predefined animation durations", () => {
      expect(DURATIONS.FAST).toBe(0.3);
      expect(DURATIONS.NORMAL).toBe(0.5);
    });
  });

  describe("SPRING_SIDEBAR", () => {
    it("should have spring physics values", () => {
      expect(SPRING_SIDEBAR.stiffness).toBe(300);
      expect(SPRING_SIDEBAR.damping).toBe(30);
    });
  });

  describe("ROUTES", () => {
    it("should have expected route paths", () => {
      expect(ROUTES.HOME).toBe("/");
      expect(ROUTES.ACCOUNT).toBe("/account");
      expect(ROUTES.SEARCH).toBe("/search");
    });

    it("SONGS_DETAIL should generate dynamic route", () => {
      expect(ROUTES.SONGS_DETAIL("abc")).toBe("/songs/abc");
    });

    it("GENRE should encode URI component", () => {
      expect(ROUTES.GENRE("synth wave")).toBe("/genre/synth%20wave");
    });

    it("PLAYLISTS_DETAIL should generate dynamic route", () => {
      expect(ROUTES.PLAYLISTS_DETAIL("playlist-1")).toBe("/playlists/playlist-1");
    });
  });
});
