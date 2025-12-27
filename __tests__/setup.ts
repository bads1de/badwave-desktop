import "@testing-library/jest-dom";

// グローバルなモック設定

// navigator.onLine のモック
Object.defineProperty(navigator, "onLine", {
  writable: true,
  configurable: true,
  value: true,
});

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
    on: jest.fn(),
    send: jest.fn(),
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
