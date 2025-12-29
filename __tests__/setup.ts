import "@testing-library/jest-dom";

// electron モジュールのモック
jest.mock("electron", () => ({
  app: {
    getPath: jest.fn().mockReturnValue("/tmp"),
    getAppPath: jest.fn().mockReturnValue("/tmp"),
    getVersion: jest.fn().mockReturnValue("0.1.0"),
  },
  ipcMain: {
    handle: jest.fn(),
    on: jest.fn(),
    removeListener: jest.fn(),
  },
  ipcRenderer: {
    invoke: jest.fn(),
    on: jest.fn(),
    removeListener: jest.fn(),
    send: jest.fn(),
  },
  contextBridge: {
    exposeInMainWorld: jest.fn(),
  },
  shell: {
    openExternal: jest.fn(),
  },
}));

// グローバルなモック設定

// navigator.onLine のモック
Object.defineProperty(navigator, "onLine", {
  writable: true,
  configurable: true,
  value: true,
});

// atob / btoa のポリフィル
if (typeof global.atob === "undefined") {
  global.atob = (str: string) => Buffer.from(str, "base64").toString("binary");
}
if (typeof global.btoa === "undefined") {
  global.btoa = (str: string) => Buffer.from(str, "binary").toString("base64");
}

// window.electron のモック
const mockElectron = {
  appInfo: {
    getVersion: jest.fn().mockReturnValue("0.1.0"),
    isElectron: true,
    platform: "win32",
  },
  window: {
    minimize: jest.fn(),
    maximize: jest.fn(),
    close: jest.fn(),
  },
  store: {
    get: jest.fn(),
    set: jest.fn(),
  },
  media: {
    onMediaControl: jest.fn(),
  },
  ipc: {
    invoke: jest.fn(),
    on: jest.fn().mockReturnValue(() => {}),
    send: jest.fn(),
  },
  offline: {
    getSongs: jest.fn().mockResolvedValue([]),
    checkStatus: jest.fn().mockResolvedValue({ isDownloaded: false }),
    deleteSong: jest.fn().mockResolvedValue({ success: true }),
    downloadSong: jest.fn().mockResolvedValue({ success: true }),
  },
  dev: {
    toggleOfflineSimulation: jest.fn().mockResolvedValue({ isOffline: false }),
    getOfflineSimulationStatus: jest
      .fn()
      .mockResolvedValue({ isOffline: false }),
    setOfflineSimulation: jest.fn().mockResolvedValue({ isOffline: false }),
  },
  cache: {
    syncSongsMetadata: jest.fn().mockResolvedValue({ success: true, count: 0 }),
    syncPlaylists: jest.fn().mockResolvedValue({ success: true, count: 0 }),
    syncPlaylistSongs: jest.fn().mockResolvedValue({ success: true, count: 0 }),
    syncLikedSongs: jest.fn().mockResolvedValue({ success: true, count: 0 }),
    getCachedPlaylists: jest.fn().mockResolvedValue([]),
    getCachedLikedSongs: jest.fn().mockResolvedValue([]),
    getCachedPlaylistSongs: jest.fn().mockResolvedValue([]),
  },
  auth: {
    saveCachedUser: jest.fn().mockResolvedValue({ success: true }),
    getCachedUser: jest.fn().mockResolvedValue(null),
    clearCachedUser: jest.fn().mockResolvedValue({ success: true }),
  },
};

Object.defineProperty(window, "electron", {
  value: mockElectron,
  writable: true,
  configurable: true,
});

// matchMedia のモック
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
