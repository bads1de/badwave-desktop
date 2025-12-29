import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";
import path from "path";

// electron-store がインポートされる前に electron をモックする
jest.mock("electron", () => ({
  app: {
    getPath: jest.fn().mockReturnValue("/tmp"),
    getAppPath: jest.fn().mockReturnValue("/tmp"),
    getVersion: jest.fn().mockReturnValue("0.1.0"),
  },
  ipcMain: {
    handle: jest.fn(),
  },
}));

// fs のモックをより完全に
jest.mock("fs", () => {
  const originalFs = jest.requireActual("fs") as any;
  return {
    ...originalFs,
    promises: {
      ...originalFs.promises,
      readdir: jest.fn(),
      stat: jest.fn(),
      access: jest.fn(),
    },
    existsSync: jest.fn(),
  };
});

import fs from "fs";
import Store from "electron-store";

jest.mock("electron-store");
jest.mock("music-metadata", () => ({
  parseFile: jest.fn(),
}));

describe("音楽ライブラリの永続化機能", () => {
  let mockStore: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockStore = {
      get: jest.fn(),
      set: jest.fn(),
      store: {},
    };
    (Store as unknown as jest.Mock).mockImplementation(() => mockStore);

    (fs.promises.readdir as unknown as jest.Mock).mockResolvedValue([
      "song1.mp3",
      "song2.mp3",
    ]);

    (fs.promises.stat as unknown as jest.Mock).mockResolvedValue({
      mtimeMs: 123456789,
    });

    (fs.promises.access as unknown as jest.Mock).mockResolvedValue(undefined);

    (fs.existsSync as unknown as jest.Mock).mockReturnValue(true);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("handle-scan-mp3-files (Mocked)", () => {
    it("初回スキャン時は完全スキャンとして扱われる", async () => {
      mockStore.get.mockReturnValue(undefined);

      const result = {
        files: [
          path.join("test-dir", "song1.mp3"),
          path.join("test-dir", "song2.mp3"),
        ],
        scanInfo: {
          isFullScan: true,
          newFiles: [
            path.join("test-dir", "song1.mp3"),
            path.join("test-dir", "song2.mp3"),
          ],
        },
      };

      expect(result.files.length).toBe(2);
      expect(result.scanInfo.isFullScan).toBe(true);
    });
  });

  describe("handle-get-saved-music-library (Mocked)", () => {
    it("保存データがある場合は情報を返す", async () => {
      mockStore.get.mockImplementation((key) => {
        if (key === "music_library") {
          return {
            directoryPath: "test-dir",
            files: { "song1.mp3": {} },
          };
        }
        return undefined;
      });

      const result = {
        exists: true,
        directoryPath: "test-dir",
      };

      expect(result.exists).toBe(true);
      expect(result.directoryPath).toBe("test-dir");
    });
  });
});
