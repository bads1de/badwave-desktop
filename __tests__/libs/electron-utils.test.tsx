import { electronAPI } from "@/libs/electron/index";
import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";

describe("libs/electron", () => {
  // 元のwindowオブジェクトを保存
  const originalWindow = global.window;

  beforeEach(() => {
    // windowオブジェクトのモックをリセット
    // @ts-ignore
    delete global.window.electron;
  });

  afterEach(() => {
    // windowオブジェクトを復元
    global.window = originalWindow;
    jest.restoreAllMocks();
  });

  describe("offline API", () => {
    describe("in Electron environment", () => {
      const mockOfflineAPI = {
        getSongs: jest.fn<() => Promise<any[]>>(),
        checkStatus:
          jest.fn<
            (
              id: string
            ) => Promise<{ isDownloaded: boolean; localPath?: string }>
          >(),
        deleteSong:
          jest.fn<
            (id: string) => Promise<{ success: boolean; error?: string }>
          >(),
        downloadSong: jest.fn<
          (payload: any) => Promise<{
            success: boolean;
            localPath?: string;
            error?: string;
          }>
        >(),
      };

      beforeEach(() => {
        // window.electron をモック
        Object.defineProperty(global.window, "electron", {
          value: {
            appInfo: { isElectron: true },
            offline: mockOfflineAPI,
          },
          writable: true,
        });
      });

      it("getSongs should call window.electron.offline.getSongs", async () => {
        const mockSongs = [{ id: "1", title: "Test" }];
        mockOfflineAPI.getSongs.mockResolvedValue(mockSongs);

        const result = await electronAPI.offline.getSongs();
        expect(mockOfflineAPI.getSongs).toHaveBeenCalled();
        expect(result).toEqual(mockSongs);
      });

      it("checkStatus should call window.electron.offline.checkStatus", async () => {
        const mockResult = { isDownloaded: true, localPath: "path/to/song" };
        mockOfflineAPI.checkStatus.mockResolvedValue(mockResult);

        const result = await electronAPI.offline.checkStatus("song-1");
        expect(mockOfflineAPI.checkStatus).toHaveBeenCalledWith("song-1");
        expect(result).toEqual(mockResult);
      });

      it("deleteSong should call window.electron.offline.deleteSong", async () => {
        const mockResponse = { success: true };
        mockOfflineAPI.deleteSong.mockResolvedValue(mockResponse);

        const result = await electronAPI.offline.deleteSong("song-1");
        expect(mockOfflineAPI.deleteSong).toHaveBeenCalledWith("song-1");
        expect(result).toEqual(mockResponse);
      });

      it("downloadSong should call window.electron.offline.downloadSong", async () => {
        const mockPayload = { id: "1", title: "Test" } as any;
        const mockResponse = { success: true };
        mockOfflineAPI.downloadSong.mockResolvedValue(mockResponse);

        const result = await electronAPI.offline.downloadSong(mockPayload);
        expect(mockOfflineAPI.downloadSong).toHaveBeenCalledWith(mockPayload);
        expect(result).toEqual(mockResponse);
      });
    });

    describe("in Web environment (Non-Electron)", () => {
      beforeEach(() => {
        // window.electron を undefined にする
        // @ts-ignore
        global.window.electron = undefined;
      });

      it("getSongs should return empty array", async () => {
        const result = await electronAPI.offline.getSongs();
        expect(result).toEqual([]);
      });

      it("checkStatus should return { isDownloaded: false }", async () => {
        const result = await electronAPI.offline.checkStatus("song-1");
        expect(result).toEqual({ isDownloaded: false });
      });

      it("deleteSong should return error object", async () => {
        const result = await electronAPI.offline.deleteSong("song-1");
        expect(result).toEqual({
          success: false,
          error: "Not in Electron environment",
        });
      });

      it("downloadSong should return error object", async () => {
        const mockPayload = { id: "1" } as any;
        const result = await electronAPI.offline.downloadSong(mockPayload);
        expect(result).toEqual({
          success: false,
          error: "Not in Electron environment",
        });
      });
    });
  });
});
