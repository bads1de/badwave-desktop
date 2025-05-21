# ローカル MP3 ファイル再生機能の実装手順

## 1. 必要なライブラリのインストール

まず、MP3 ファイルのメタデータを抽出するためのライブラリをインストールします。

```bash
# music-metadataライブラリをインストール
npm install music-metadata

# 必要に応じてelectron-storeもインストール（既にインストール済みの場合は不要）
npm install electron-store
```

## 2. メインプロセス側の実装

### 2.1 ファイル選択ダイアログの実装

`electron/main.ts`ファイルを編集して、ファイル選択ダイアログを表示する関数を追加します。

```typescript
// ファイル選択ダイアログを表示する関数
ipcMain.handle("select-mp3-files", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ["openFile", "multiSelections"],
    filters: [
      { name: "MP3 Files", extensions: ["mp3"] },
      { name: "All Files", extensions: ["*"] },
    ],
  });

  if (canceled) {
    return [];
  }

  return filePaths;
});
```

### 2.2 MP3 ファイルのメタデータ抽出機能の実装

`electron/main.ts`ファイルに、MP3 ファイルからメタデータを抽出する関数を追加します。

```typescript
import * as mm from "music-metadata";

// MP3ファイルのメタデータを取得する関数
ipcMain.handle("get-mp3-metadata", async (_, filePath) => {
  try {
    const metadata = await mm.parseFile(filePath);
    const picture = metadata.common.picture?.[0];

    return {
      title: metadata.common.title || path.basename(filePath, ".mp3"),
      artist: metadata.common.artist || "Unknown Artist",
      album: metadata.common.album || "Unknown Album",
      duration: metadata.format.duration || 0,
      coverImage: picture
        ? {
            format: picture.format,
            data: picture.data.toString("base64"),
          }
        : null,
      filePath: filePath,
    };
  } catch (error) {
    console.error("メタデータの取得に失敗しました:", error);
    return {
      title: path.basename(filePath, ".mp3"),
      artist: "Unknown Artist",
      album: "Unknown Album",
      duration: 0,
      coverImage: null,
      filePath: filePath,
    };
  }
});
```

### 2.3 ファイルプロトコルの設定

`electron/main.ts`ファイルに、ファイルプロトコルを設定する関数を追加します。

```typescript
// ファイルプロトコルの設定
app.whenReady().then(() => {
  // 既存のコード...

  // ファイルプロトコルの設定
  protocol.handle("local-file", (request) => {
    const url = request.url.replace("local-file://", "");
    try {
      return net.fetch(`file://${decodeURIComponent(url)}`);
    } catch (error) {
      console.error(error);
      return new Response("", { status: 404 });
    }
  });

  // 既存のコード...
});
```

## 3. プリロードスクリプトの拡張

`electron/preload.ts`ファイルを編集して、ファイル選択ダイアログとメタデータ抽出機能をレンダラープロセスに公開します。

```typescript
// ファイル選択関連の機能を公開
contextBridge.exposeInMainWorld("electron", {
  // 既存のコード...

  // ローカルファイル関連の機能
  localFiles: {
    selectMp3Files: () => ipcRenderer.invoke("select-mp3-files"),
    getMetadata: (filePath: string) =>
      ipcRenderer.invoke("get-mp3-metadata", filePath),
  },

  // 既存のコード...
});
```

## 4. レンダラープロセス側の実装

### 4.1 型定義の追加

`types/index.ts`ファイルに、ローカルファイルのメタデータの型定義を追加します。

```typescript
// ローカルファイルのメタデータの型定義
export interface LocalFileMetadata {
  title: string;
  artist: string;
  album: string;
  duration: number;
  coverImage: {
    format: string;
    data: string;
  } | null;
  filePath: string;
}
```

### 4.2 ローカルファイルのストア実装

`hooks/stores/useLocalFilesStore.ts`ファイルを作成して、ローカルファイルのプレイリスト管理機能を実装します。

```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { LocalFileMetadata } from "@/types";

interface LocalFilesStore {
  localFiles: LocalFileMetadata[];
  currentIndex: number;

  addFiles: (files: LocalFileMetadata[]) => void;
  clearFiles: () => void;
  playFile: (index: number) => void;
  nextFile: () => void;
  previousFile: () => void;
  getCurrentFile: () => LocalFileMetadata | null;
}

const useLocalFilesStore = create<LocalFilesStore>()(
  persist(
    (set, get) => ({
      localFiles: [],
      currentIndex: -1,

      addFiles: (files) => {
        set((state) => ({
          localFiles: [...state.localFiles, ...files],
        }));
      },

      clearFiles: () => {
        set({ localFiles: [], currentIndex: -1 });
      },

      playFile: (index) => {
        set({ currentIndex: index });
      },

      nextFile: () => {
        const { localFiles, currentIndex } = get();
        if (currentIndex < localFiles.length - 1) {
          set({ currentIndex: currentIndex + 1 });
        }
      },

      previousFile: () => {
        const { currentIndex } = get();
        if (currentIndex > 0) {
          set({ currentIndex: currentIndex - 1 });
        }
      },

      getCurrentFile: () => {
        const { localFiles, currentIndex } = get();
        return currentIndex >= 0 && currentIndex < localFiles.length
          ? localFiles[currentIndex]
          : null;
      },
    }),
    {
      name: "local-files-storage",
    }
  )
);

export default useLocalFilesStore;
```

### 4.3 ローカルファイル選択コンポーネントの実装

`components/LocalFiles/LocalFileSelector.tsx`ファイルを作成して、ローカルファイル選択ボタンのコンポーネントを実装します。

```typescript
import { useState } from "react";
import Button from "@/components/common/Button";
import useLocalFilesStore from "@/hooks/stores/useLocalFilesStore";
import { LocalFileMetadata } from "@/types";

const LocalFileSelector = () => {
  const [isLoading, setIsLoading] = useState(false);
  const addFiles = useLocalFilesStore((state) => state.addFiles);

  const handleSelectFiles = async () => {
    if (!window.electron?.localFiles) {
      console.error("Electron APIが利用できません");
      return;
    }

    setIsLoading(true);

    try {
      const filePaths = await window.electron.localFiles.selectMp3Files();

      if (filePaths.length > 0) {
        const metadataPromises = filePaths.map((filePath: string) =>
          window.electron.localFiles.getMetadata(filePath)
        );

        const metadataList = await Promise.all(metadataPromises);
        addFiles(metadataList);
      }
    } catch (error) {
      console.error("ファイル選択中にエラーが発生しました:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleSelectFiles}
      disabled={isLoading}
      className="w-full md:w-auto"
    >
      {isLoading ? "ロード中..." : "ローカルファイルを選択"}
    </Button>
  );
};

export default LocalFileSelector;
```

### 4.4 ローカルファイルリストコンポーネントの実装

`components/LocalFiles/LocalFileList.tsx`ファイルを作成して、選択されたローカルファイルのリストを表示するコンポーネントを実装します。

```typescript
import { useCallback } from "react";
import Image from "next/image";
import useLocalFilesStore from "@/hooks/stores/useLocalFilesStore";
import { LocalFileMetadata } from "@/types";
import { BsPlayFill } from "react-icons/bs";

const LocalFileList = () => {
  const { localFiles, currentIndex, playFile } = useLocalFilesStore();

  const handlePlay = useCallback(
    (index: number) => {
      playFile(index);
    },
    [playFile]
  );

  if (localFiles.length === 0) {
    return (
      <div className="text-center py-10 text-zinc-400">
        ローカルファイルが選択されていません
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-y-2 w-full">
      {localFiles.map((file, index) => (
        <div
          key={`${file.filePath}-${index}`}
          className={`flex items-center gap-x-3 cursor-pointer hover:bg-zinc-800/50 p-2 rounded-md ${
            currentIndex === index ? "bg-zinc-800" : ""
          }`}
          onClick={() => handlePlay(index)}
        >
          <div className="relative min-h-[48px] min-w-[48px] h-12 w-12 rounded-md overflow-hidden">
            {file.coverImage ? (
              <Image
                src={`data:${file.coverImage.format};base64,${file.coverImage.data}`}
                alt="Cover"
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full w-full bg-zinc-800">
                <BsPlayFill size={24} className="text-zinc-400" />
              </div>
            )}
          </div>
          <div className="flex flex-col overflow-hidden">
            <p className="truncate font-semibold">{file.title}</p>
            <p className="text-sm text-zinc-400 truncate">
              {file.artist} • {file.album}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LocalFileList;
```

### 4.5 ローカルファイル再生コンポーネントの実装

`components/LocalFiles/LocalFilePlayer.tsx`ファイルを作成して、ローカルファイルの再生コンポーネントを実装します。

```typescript
import { useEffect, useRef, useState } from "react";
import useLocalFilesStore from "@/hooks/stores/useLocalFilesStore";
import { BsPlayFill, BsPauseFill } from "react-icons/bs";
import { AiFillStepBackward, AiFillStepForward } from "react-icons/ai";
import Image from "next/image";
import Slider from "@/components/Player/Slider";

const LocalFilePlayer = () => {
  const { localFiles, currentIndex, nextFile, previousFile } =
    useLocalFilesStore();
  const currentFile = localFiles[currentIndex];
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!currentFile) return;

    const audio = audioRef.current;
    if (!audio) return;

    // ファイルパスをlocal-fileプロトコルに変換
    audio.src = `local-file://${currentFile.filePath}`;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      nextFile();
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [currentFile, nextFile]);

  useEffect(() => {
    if (isPlaying) {
      audioRef.current?.play();
    } else {
      audioRef.current?.pause();
    }
  }, [isPlaying]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value;
      setCurrentTime(value);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (!currentFile) {
    return null;
  }

  return (
    <div className="bg-zinc-900 p-4 rounded-lg">
      <audio ref={audioRef} />

      <div className="flex items-center gap-x-4">
        <div className="relative h-16 w-16 rounded-md overflow-hidden">
          {currentFile.coverImage ? (
            <Image
              src={`data:${currentFile.coverImage.format};base64,${currentFile.coverImage.data}`}
              alt="Cover"
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full w-full bg-zinc-800">
              <BsPlayFill size={30} className="text-zinc-400" />
            </div>
          )}
        </div>

        <div className="flex flex-col flex-1 overflow-hidden">
          <p className="font-semibold truncate">{currentFile.title}</p>
          <p className="text-sm text-zinc-400 truncate">{currentFile.artist}</p>
        </div>
      </div>

      <div className="flex flex-col items-center mt-4">
        <div className="flex items-center gap-x-6">
          <AiFillStepBackward
            onClick={previousFile}
            size={24}
            className="cursor-pointer text-zinc-400 hover:text-white transition"
          />

          <div
            onClick={handlePlayPause}
            className="flex items-center justify-center h-10 w-10 rounded-full bg-white p-1 cursor-pointer"
          >
            {isPlaying ? (
              <BsPauseFill size={30} className="text-black" />
            ) : (
              <BsPlayFill size={30} className="text-black" />
            )}
          </div>

          <AiFillStepForward
            onClick={nextFile}
            size={24}
            className="cursor-pointer text-zinc-400 hover:text-white transition"
          />
        </div>

        <div className="w-full mt-4">
          <div className="flex items-center gap-x-2">
            <span className="text-xs text-zinc-400">
              {formatTime(currentTime)}
            </span>
            <Slider
              value={currentTime}
              onChange={handleSeek}
              max={duration || 1}
              step={0.1}
            />
            <span className="text-xs text-zinc-400">
              {formatTime(duration)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocalFilePlayer;
```

### 4.6 ローカルファイル管理ページの実装

`app/local-files/page.tsx`ファイルを作成して、ローカルファイル管理ページを実装します。

```typescript
"use client";

import { useEffect, useState } from "react";
import LocalFileSelector from "@/components/LocalFiles/LocalFileSelector";
import LocalFileList from "@/components/LocalFiles/LocalFileList";
import LocalFilePlayer from "@/components/LocalFiles/LocalFilePlayer";
import useLocalFilesStore from "@/hooks/stores/useLocalFilesStore";
import { isElectron } from "@/libs/electron-utils";

const LocalFilesPage = () => {
  const [isClient, setIsClient] = useState(false);
  const { localFiles, currentIndex } = useLocalFilesStore();

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  const isElectronApp = isElectron();

  if (!isElectronApp) {
    return (
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-6">ローカルファイル</h1>
        <div className="bg-zinc-900 p-6 rounded-lg">
          <p className="text-center py-10 text-zinc-400">
            この機能はデスクトップアプリでのみ利用できます。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">ローカルファイル</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="bg-zinc-900 p-6 rounded-lg">
            <div className="mb-4">
              <LocalFileSelector />
            </div>
            <LocalFileList />
          </div>
        </div>

        <div>
          {currentIndex >= 0 && localFiles.length > 0 && <LocalFilePlayer />}
        </div>
      </div>
    </div>
  );
};

export default LocalFilesPage;
```

## 5. ナビゲーションの更新

`components/Sidebar/Sidebar.tsx`ファイルを編集して、ローカルファイルページへのリンクを追加します。

```typescript
// ローカルファイルページへのリンクを追加
const routes = [
  // 既存のルート...
  {
    icon: HiFolder,
    label: "ローカルファイル",
    active: pathname === "/local-files",
    href: "/local-files",
  },
  // 既存のルート...
];
```

## 6. テストの実装

### 6.1 単体テスト

`__tests__/electron/metadata.test.ts`ファイルを作成して、メタデータ抽出機能のテストを実装します。

```typescript
import * as path from "path";
import * as mm from "music-metadata";
import { getMetadata } from "../../electron/metadata";

// モックの設定
jest.mock("music-metadata");

describe("メタデータ抽出機能のテスト", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("有効なMP3ファイルからメタデータを抽出できる", async () => {
    // モックの設定
    const mockMetadata = {
      common: {
        title: "Test Song",
        artist: "Test Artist",
        album: "Test Album",
        picture: [
          {
            format: "image/jpeg",
            data: Buffer.from("test-image-data"),
          },
        ],
      },
      format: {
        duration: 180,
      },
    };

    (mm.parseFile as jest.Mock).mockResolvedValue(mockMetadata);

    // テスト対象の関数を実行
    const testFilePath = "/path/to/test.mp3";
    const result = await getMetadata(testFilePath);

    // 検証
    expect(mm.parseFile).toHaveBeenCalledWith(testFilePath);
    expect(result).toEqual({
      title: "Test Song",
      artist: "Test Artist",
      album: "Test Album",
      duration: 180,
      coverImage: {
        format: "image/jpeg",
        data: "dGVzdC1pbWFnZS1kYXRh", // Base64エンコードされたデータ
      },
      filePath: testFilePath,
    });
  });

  test("メタデータがない場合はデフォルト値を返す", async () => {
    // モックの設定
    const mockMetadata = {
      common: {},
      format: {},
    };

    (mm.parseFile as jest.Mock).mockResolvedValue(mockMetadata);

    // テスト対象の関数を実行
    const testFilePath = "/path/to/test.mp3";
    const result = await getMetadata(testFilePath);

    // 検証
    expect(result).toEqual({
      title: "test",
      artist: "Unknown Artist",
      album: "Unknown Album",
      duration: 0,
      coverImage: null,
      filePath: testFilePath,
    });
  });

  test("エラーが発生した場合はデフォルト値を返す", async () => {
    // モックの設定
    (mm.parseFile as jest.Mock).mockRejectedValue(new Error("テストエラー"));

    // テスト対象の関数を実行
    const testFilePath = "/path/to/test.mp3";
    const result = await getMetadata(testFilePath);

    // 検証
    expect(result).toEqual({
      title: "test",
      artist: "Unknown Artist",
      album: "Unknown Album",
      duration: 0,
      coverImage: null,
      filePath: testFilePath,
    });
  });
});
```

### 6.2 結合テスト

`__tests__/components/LocalFiles/LocalFileSelector.test.tsx`ファイルを作成して、ローカルファイル選択コンポーネントのテストを実装します。

```typescript
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LocalFileSelector from "@/components/LocalFiles/LocalFileSelector";
import useLocalFilesStore from "@/hooks/stores/useLocalFilesStore";

// モックの設定
jest.mock("@/hooks/stores/useLocalFilesStore");

// Electronのモック
const mockElectron = {
  localFiles: {
    selectMp3Files: jest.fn(),
    getMetadata: jest.fn(),
  },
};

// グローバルオブジェクトにElectronのモックを追加
global.window.electron = mockElectron;

describe("LocalFileSelector", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // useLocalFilesStoreのモック
    (useLocalFilesStore as jest.Mock).mockReturnValue({
      addFiles: jest.fn(),
    });
  });

  test("ファイル選択ボタンをクリックするとElectron APIが呼び出される", async () => {
    // モックの設定
    const mockFilePaths = ["/path/to/test.mp3"];
    const mockMetadata = {
      title: "Test Song",
      artist: "Test Artist",
      album: "Test Album",
      duration: 180,
      coverImage: null,
      filePath: "/path/to/test.mp3",
    };

    mockElectron.localFiles.selectMp3Files.mockResolvedValue(mockFilePaths);
    mockElectron.localFiles.getMetadata.mockResolvedValue(mockMetadata);

    // コンポーネントをレンダリング
    render(<LocalFileSelector />);

    // ボタンをクリック
    fireEvent.click(screen.getByText("ローカルファイルを選択"));

    // 検証
    await waitFor(() => {
      expect(mockElectron.localFiles.selectMp3Files).toHaveBeenCalled();
      expect(mockElectron.localFiles.getMetadata).toHaveBeenCalledWith(
        mockFilePaths[0]
      );
      expect(useLocalFilesStore().addFiles).toHaveBeenCalledWith([
        mockMetadata,
      ]);
    });
  });

  test("ファイル選択がキャンセルされた場合は何も起こらない", async () => {
    // モックの設定
    mockElectron.localFiles.selectMp3Files.mockResolvedValue([]);

    // コンポーネントをレンダリング
    render(<LocalFileSelector />);

    // ボタンをクリック
    fireEvent.click(screen.getByText("ローカルファイルを選択"));

    // 検証
    await waitFor(() => {
      expect(mockElectron.localFiles.selectMp3Files).toHaveBeenCalled();
      expect(mockElectron.localFiles.getMetadata).not.toHaveBeenCalled();
      expect(useLocalFilesStore().addFiles).not.toHaveBeenCalled();
    });
  });
});
```

## 7. 実装の注意点

### 7.1 セキュリティ対策

1. **ファイルアクセスの制限**

   - ユーザーが選択したファイルのみにアクセスするようにする
   - ファイルシステム全体へのアクセスを許可しない

2. **ファイルプロトコルの安全な使用**
   - `local-file://`プロトコルを使用して、ローカルファイルへのアクセスを制限する
   - クロスサイトスクリプティング（XSS）攻撃を防ぐために、ファイルパスをエスケープする

### 7.2 パフォーマンス最適化

1. **メタデータのキャッシュ**

   - 一度読み込んだメタデータをキャッシュして、再読み込みを避ける
   - `electron-store`を使用して、メタデータをディスクに保存する

2. **画像の最適化**
   - カバー画像のサイズを制限して、メモリ使用量を削減する
   - 必要に応じて画像をリサイズする

### 7.3 エラーハンドリング

1. **ファイル読み込みエラー**

   - ファイルが存在しない場合や読み込みに失敗した場合のエラーハンドリング
   - ユーザーにわかりやすいエラーメッセージを表示する

2. **メタデータ抽出エラー**
   - メタデータの抽出に失敗した場合のフォールバック処理
   - 最低限の情報（ファイル名など）を表示する

## 8. デプロイと配布

1. **アプリケーションのビルド**

   - `npm run build:electron`コマンドで Electron アプリケーションをビルド
   - `npm run package:electron`コマンドでインストーラーを作成

2. **テスト**

   - Windows、macOS、Linux の各プラットフォームでテスト
   - ファイルパスの違いによる問題がないことを確認

3. **配布**
   - GitHub Releases などを使用して、アプリケーションを配布
   - 自動アップデート機能を実装して、ユーザーが最新バージョンを使用できるようにする
