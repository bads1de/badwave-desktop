# ローカル MP3 ファイル再生機能の実装計画

## 1. 概要

BadWave デスクトップアプリケーションにローカル MP3 ファイルを再生する機能を追加します。この機能により、ユーザーは自分のコンピューター上の MP3 ファイルを選択して再生できるようになります。

また、Spotify のように、ユーザーがフォルダーを指定して、そのフォルダー内のすべての MP3 ファイルを自動的に取得し、テーブル形式で一覧表示する機能も実装します。サイドバーに「ローカル」タブを追加し、このローカル MP3 ファイル機能に簡単にアクセスできるようにします。

## 2. 現状分析

### 現在の音楽再生機能

- 現在のアプリケーションは Supabase に保存された音楽ファイルをストリーミング再生しています
- HTML5 の`<audio>`要素を使用して音楽を再生しています
- 再生状態は React のステート管理を通じて制御されています
- プレイヤーコンポーネントは`PlayerContent.tsx`に実装されています

### Electron 環境

- Electron アプリケーションは`electron/main.ts`がメインプロセスとして動作しています
- プリロードスクリプト`electron/preload.ts`を通じてレンダラープロセスとメインプロセス間の通信を行っています
- 現在はファイル選択ダイアログの実装がありません

## 3. 実装計画

### 3.1 ファイル選択ダイアログの実装

#### メインプロセス側（electron/main.ts）

1. `dialog.showOpenDialog`を使用してファイル選択ダイアログを表示する関数を実装
2. 選択されたファイルのパスをレンダラープロセスに返す
3. ファイルのメタデータ（タイトル、アーティスト、アルバム、カバー画像など）を抽出する機能を実装

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

### 3.1.2 フォルダー選択ダイアログの実装

#### メインプロセス側（electron/main.ts）

1. `dialog.showOpenDialog`を使用してフォルダー選択ダイアログを表示する関数を実装
2. 選択されたフォルダーパスをレンダラープロセスに返す
3. フォルダー内の MP3 ファイルを再帰的に検索する機能を実装

```typescript
// フォルダー選択ダイアログを表示する関数
ipcMain.handle("select-music-folder", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ["openDirectory"],
    title: "音楽フォルダーを選択",
  });

  if (canceled || filePaths.length === 0) {
    return { folderPath: null, files: [] };
  }

  const folderPath = filePaths[0];
  const mp3Files = await scanFolderForMp3Files(folderPath);

  return { folderPath, files: mp3Files };
});

// フォルダー内のMP3ファイルを再帰的に検索する関数
async function scanFolderForMp3Files(folderPath: string): Promise<string[]> {
  const mp3Files: string[] = [];

  // フォルダー内のファイルとサブフォルダーを取得
  const scanFolder = async (dirPath: string) => {
    try {
      const entries = await fs.promises.readdir(dirPath, {
        withFileTypes: true,
      });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
          // サブフォルダーを再帰的にスキャン
          await scanFolder(fullPath);
        } else if (
          entry.isFile() &&
          path.extname(entry.name).toLowerCase() === ".mp3"
        ) {
          // MP3ファイルを配列に追加
          mp3Files.push(fullPath);
        }
      }
    } catch (error) {
      console.error(
        `フォルダーのスキャン中にエラーが発生しました: ${dirPath}`,
        error
      );
    }
  };

  await scanFolder(folderPath);
  return mp3Files;
}
```

#### プリロードスクリプト（electron/preload.ts）

1. ファイル選択ダイアログとフォルダー選択ダイアログを呼び出すための関数をレンダラープロセスに公開

```typescript
// ファイル選択関連の機能を公開
localFiles: {
  // 個別のMP3ファイル選択
  selectMp3Files: () => ipcRenderer.invoke('select-mp3-files'),
  // フォルダー選択とMP3ファイルのスキャン
  selectMusicFolder: () => ipcRenderer.invoke('select-music-folder'),
  // メタデータ取得
  getMetadata: (filePath: string) => ipcRenderer.invoke('get-mp3-metadata', filePath),
  // 複数ファイルのメタデータを一括取得
  getMetadataForFiles: (filePaths: string[]) => ipcRenderer.invoke('get-metadata-for-files', filePaths),
}
```

### 3.2 MP3 ファイルのメタデータ抽出

#### メインプロセス側（electron/main.ts）

1. `music-metadata`ライブラリを使用して MP3 ファイルからメタデータを抽出する関数を実装
2. 抽出したメタデータをレンダラープロセスに返す
3. 複数ファイルのメタデータを一括取得する関数を実装

```typescript
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

// 複数のMP3ファイルのメタデータを一括取得する関数
ipcMain.handle("get-metadata-for-files", async (_, filePaths) => {
  // 進捗状況を追跡するための変数
  let processedCount = 0;
  const totalCount = filePaths.length;

  // 進捗状況をメインウィンドウに通知
  const notifyProgress = () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("metadata-extraction-progress", {
        processed: processedCount,
        total: totalCount,
        percentage: Math.floor((processedCount / totalCount) * 100),
      });
    }
  };

  // 並列処理の数を制限（システムリソースの使用を抑制）
  const concurrencyLimit = 5;
  const results = [];

  // ファイルを一定数ずつ処理
  for (let i = 0; i < filePaths.length; i += concurrencyLimit) {
    const batch = filePaths.slice(i, i + concurrencyLimit);
    const batchPromises = batch.map(async (filePath) => {
      try {
        const metadata = await mm.parseFile(filePath);
        const picture = metadata.common.picture?.[0];

        processedCount++;
        notifyProgress();

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
        console.error(`メタデータの取得に失敗しました: ${filePath}`, error);

        processedCount++;
        notifyProgress();

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

    // バッチ処理の結果を待機して結果配列に追加
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }

  return results;
});
```

### 3.3 ローカルファイルの再生機能

#### レンダラープロセス側

1. ローカルファイルを選択するための UI コンポーネントを実装
2. フォルダーを選択するための UI コンポーネントを実装
3. 選択されたファイルのメタデータを表示するコンポーネントを実装
4. テーブル形式でファイルリストを表示するコンポーネントを実装
5. 既存の再生機能と統合して、ローカルファイルも再生できるようにする

```typescript
// ローカルファイル選択ボタンのコンポーネント
const LocalFileSelector = () => {
  const handleSelectFiles = async () => {
    const filePaths = await window.electron.localFiles.selectMp3Files();

    if (filePaths.length > 0) {
      const metadataPromises = filePaths.map((filePath) =>
        window.electron.localFiles.getMetadata(filePath)
      );

      const metadataList = await Promise.all(metadataPromises);
      // 選択されたファイルのメタデータをステートに保存
      setLocalFiles(metadataList);
    }
  };

  return <Button onClick={handleSelectFiles}>ローカルファイルを選択</Button>;
};

// フォルダー選択ボタンのコンポーネント
const MusicFolderSelector = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<{
    processed: number;
    total: number;
    percentage: number;
  } | null>(null);
  const addFiles = useLocalFilesStore((state) => state.addFiles);

  // メタデータ抽出の進捗状況を受信するためのリスナー
  useEffect(() => {
    if (!window.electron?.ipc) return;

    const unsubscribe = window.electron.ipc.on(
      "metadata-extraction-progress",
      (data) => {
        setProgress(
          data as { processed: number; total: number; percentage: number }
        );
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  const handleSelectFolder = async () => {
    if (!window.electron?.localFiles) {
      console.error("Electron APIが利用できません");
      return;
    }

    setIsLoading(true);
    setProgress(null);

    try {
      // フォルダーを選択してMP3ファイルをスキャン
      const { folderPath, files } =
        await window.electron.localFiles.selectMusicFolder();

      if (folderPath && files.length > 0) {
        // 進捗状況の初期値を設定
        setProgress({ processed: 0, total: files.length, percentage: 0 });

        // 複数ファイルのメタデータを一括取得
        const metadataList =
          await window.electron.localFiles.getMetadataForFiles(files);

        // 取得したメタデータをストアに追加
        addFiles(metadataList);
      }
    } catch (error) {
      console.error("フォルダー選択中にエラーが発生しました:", error);
    } finally {
      setIsLoading(false);
      setProgress(null);
    }
  };

  return (
    <div>
      <Button
        onClick={handleSelectFolder}
        disabled={isLoading}
        className="w-full md:w-auto"
      >
        {isLoading ? "スキャン中..." : "音楽フォルダーを選択"}
      </Button>

      {progress && (
        <div className="mt-2">
          <div className="text-sm text-zinc-400">
            {progress.processed} / {progress.total} ファイル処理中 (
            {progress.percentage}%)
          </div>
          <div className="w-full bg-zinc-700 h-2 rounded-full mt-1">
            <div
              className="bg-green-500 h-2 rounded-full"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// MP3ファイルをテーブル形式で表示するコンポーネント
const LocalFilesTable = () => {
  const { localFiles, currentIndex, playFile } = useLocalFilesStore();
  const [sortColumn, setSortColumn] = useState<string>("title");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // ソート関数
  const sortedFiles = useMemo(() => {
    if (localFiles.length === 0) return [];

    return [...localFiles].sort((a, b) => {
      let valueA, valueB;

      // ソート対象の列に応じて比較する値を取得
      switch (sortColumn) {
        case "title":
          valueA = a.title.toLowerCase();
          valueB = b.title.toLowerCase();
          break;
        case "artist":
          valueA = a.artist.toLowerCase();
          valueB = b.artist.toLowerCase();
          break;
        case "album":
          valueA = a.album.toLowerCase();
          valueB = b.album.toLowerCase();
          break;
        case "duration":
          valueA = a.duration || 0;
          valueB = b.duration || 0;
          break;
        default:
          valueA = a.title.toLowerCase();
          valueB = b.title.toLowerCase();
      }

      // ソート方向に応じて比較結果を返す
      if (sortDirection === "asc") {
        return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
      } else {
        return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
      }
    });
  }, [localFiles, sortColumn, sortDirection]);

  // ソート列の変更
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // 同じ列をクリックした場合はソート方向を反転
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // 異なる列をクリックした場合は新しい列でソート（昇順）
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // 再生時間のフォーマット
  const formatDuration = (seconds: number) => {
    if (!seconds) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // 曲を再生
  const handlePlay = (index: number) => {
    playFile(index);
  };

  if (localFiles.length === 0) {
    return (
      <div className="text-center py-10 text-zinc-400">
        ローカルファイルが選択されていません
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-zinc-300">
        <thead className="text-xs uppercase bg-zinc-800 text-zinc-400">
          <tr>
            <th className="px-4 py-3">#</th>
            <th
              className="px-4 py-3 cursor-pointer hover:text-white"
              onClick={() => handleSort("title")}
            >
              曲名{" "}
              {sortColumn === "title" && (sortDirection === "asc" ? "↑" : "↓")}
            </th>
            <th
              className="px-4 py-3 cursor-pointer hover:text-white"
              onClick={() => handleSort("artist")}
            >
              アーティスト{" "}
              {sortColumn === "artist" && (sortDirection === "asc" ? "↑" : "↓")}
            </th>
            <th
              className="px-4 py-3 cursor-pointer hover:text-white"
              onClick={() => handleSort("album")}
            >
              アルバム{" "}
              {sortColumn === "album" && (sortDirection === "asc" ? "↑" : "↓")}
            </th>
            <th
              className="px-4 py-3 cursor-pointer hover:text-white"
              onClick={() => handleSort("duration")}
            >
              再生時間{" "}
              {sortColumn === "duration" &&
                (sortDirection === "asc" ? "↑" : "↓")}
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedFiles.map((file, index) => (
            <tr
              key={`${file.filePath}-${index}`}
              className={`border-b border-zinc-700 hover:bg-zinc-800 cursor-pointer ${
                index === currentIndex ? "bg-zinc-800" : ""
              }`}
              onClick={() => handlePlay(index)}
            >
              <td className="px-4 py-3">
                {index === currentIndex ? (
                  <div className="text-green-500">
                    <BsPlayFill size={16} />
                  </div>
                ) : (
                  index + 1
                )}
              </td>
              <td className="px-4 py-3 flex items-center gap-3">
                {file.coverImage ? (
                  <Image
                    src={`data:${file.coverImage.format};base64,${file.coverImage.data}`}
                    alt="Cover"
                    width={40}
                    height={40}
                    className="rounded-sm"
                  />
                ) : (
                  <div className="w-10 h-10 bg-zinc-700 rounded-sm flex items-center justify-center">
                    <BsMusicNote size={20} className="text-zinc-500" />
                  </div>
                )}
                <span className="truncate max-w-[200px]">{file.title}</span>
              </td>
              <td className="px-4 py-3 truncate max-w-[150px]">
                {file.artist}
              </td>
              <td className="px-4 py-3 truncate max-w-[150px]">{file.album}</td>
              <td className="px-4 py-3">{formatDuration(file.duration)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

### 3.4 ローカルファイルのプレイリスト管理

1. 選択されたローカルファイルをプレイリストとして管理する機能を実装
2. ローカルファイルのプレイリストを保存・読み込みする機能を実装

```typescript
// ローカルファイルのプレイリスト管理
const useLocalFilesStore = create<LocalFilesStore>((set, get) => ({
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
}));
```

### 3.5 ファイルプロトコルの設定

1. `file://`プロトコルを安全に使用するための設定を追加

```typescript
// ファイルプロトコルの設定（Electron 25以降の推奨方法）
protocol.handle("local-file", (request) => {
  const url = request.url.replace("local-file://", "");
  try {
    return net.fetch(`file://${decodeURIComponent(url)}`);
  } catch (error) {
    console.error(error);
    return new Response("", { status: 404 });
  }
});
```

## 4. UI 設計

### 4.1 ローカルファイル選択画面

- ファイル選択ボタン
- フォルダー選択ボタン（Spotify のように、フォルダー内のすべての MP3 ファイルを自動的に取得）
- 選択されたファイルのテーブル形式での一覧表示
  - 曲名、アーティスト名、アルバム名、再生時間などの情報を表示
  - ソート機能（曲名、アーティスト名、アルバム名、再生時間でソート可能）
  - リスト内の曲をクリックすると再生できる
- ファイルのメタデータ（タイトル、アーティスト、アルバム、カバー画像）の表示
- 再生ボタン
- メタデータ抽出の進捗状況表示

### 4.2 プレイヤー画面の拡張

- 現在のプレイヤー画面にローカルファイルの再生状態を表示
- ローカルファイルとオンラインファイルの切り替え機能

### 4.3 サイドバーの拡張

- サイドバーに「ローカル」タブを追加
- ローカルファイル機能へのアクセスを簡単にする

```typescript
// サイドバーに「ローカル」タブを追加
// components/Sidebar/Sidebar.tsx
import { HiHome, HiSearch, HiFolder, HiHeart } from "react-icons/hi";

const routes = [
  {
    icon: HiHome,
    label: "ホーム",
    active: pathname === "/",
    href: "/",
  },
  {
    icon: HiSearch,
    label: "検索",
    active: pathname === "/search",
    href: "/search",
  },
  {
    icon: HiFolder,
    label: "ローカル",
    active: pathname === "/local-files",
    href: "/local-files",
  },
  {
    icon: HiHeart,
    label: "お気に入り",
    active: pathname === "/liked",
    href: "/liked",
  },
];
```

## 5. 必要なライブラリ

- `music-metadata`: MP3 ファイルからメタデータを抽出するためのライブラリ
- `electron-store`: ローカルファイルのプレイリストを保存するためのライブラリ

## 6. 実装手順

1. 必要なライブラリのインストール
2. メインプロセス側のファイル選択ダイアログとメタデータ抽出機能の実装
   - 個別ファイル選択機能
   - フォルダー選択と再帰的スキャン機能
   - メタデータ一括抽出機能
3. プリロードスクリプトの拡張
4. レンダラープロセス側の UI コンポーネントの実装
   - ローカルファイル選択コンポーネント
   - フォルダー選択コンポーネント
   - テーブル表示コンポーネント
   - 進捗表示コンポーネント
5. ローカルファイルの再生機能の実装
6. プレイリスト管理機能の実装
7. サイドバーに「ローカル」タブの追加
8. ローカルファイル管理ページの実装

```typescript
// ローカルファイル管理ページの実装例
// app/local-files/page.tsx
"use client";

import { useEffect, useState } from "react";
import LocalFileSelector from "@/components/LocalFiles/LocalFileSelector";
import MusicFolderSelector from "@/components/LocalFiles/MusicFolderSelector";
import LocalFilesTable from "@/components/LocalFiles/LocalFilesTable";
import LocalFilePlayer from "@/components/LocalFiles/LocalFilePlayer";
import useLocalFilesStore from "@/hooks/stores/useLocalFilesStore";
import { isElectron } from "@/libs/electron-utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-zinc-900 p-6 rounded-lg">
          <Tabs defaultValue="folder" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="folder">フォルダーから追加</TabsTrigger>
              <TabsTrigger value="files">ファイルから追加</TabsTrigger>
            </TabsList>
            <TabsContent value="folder">
              <div className="mb-6">
                <MusicFolderSelector />
              </div>
            </TabsContent>
            <TabsContent value="files">
              <div className="mb-6">
                <LocalFileSelector />
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-4">ライブラリ</h2>
            <LocalFilesTable />
          </div>
        </div>

        {currentIndex >= 0 && localFiles.length > 0 && (
          <div className="bg-zinc-900 p-6 rounded-lg">
            <LocalFilePlayer />
          </div>
        )}
      </div>
    </div>
  );
};

export default LocalFilesPage;
```

9. テストとデバッグ

## 7. 考慮事項

- セキュリティ: ローカルファイルへのアクセスはユーザーの許可が必要
- パフォーマンス: 大量の MP3 ファイルを選択した場合のメタデータ抽出のパフォーマンス
- UX: ユーザーがローカルファイルとオンラインファイルを区別できるようにする
- 互換性: 異なるプラットフォーム（Windows、macOS、Linux）での動作確認

## 8. テスト計画

### 8.1 単体テスト

1. **ファイル選択ダイアログのテスト**

   - 正常系: ファイルが選択された場合、正しいファイルパスが返されることを確認
   - 異常系: キャンセルされた場合、空の配列が返されることを確認

2. **フォルダー選択ダイアログのテスト**

   - 正常系: フォルダーが選択された場合、正しいフォルダーパスが返されることを確認
   - 異常系: キャンセルされた場合、null が返されることを確認

3. **フォルダー内の MP3 ファイル再帰的スキャン機能のテスト**

   - 正常系: フォルダー内のすべての MP3 ファイルが検出されることを確認
   - 異常系: 存在しないフォルダーの場合、空の配列が返されることを確認
   - 境界値: 非常に多くのファイルを含むフォルダー、非常に深い階層のフォルダー構造

4. **メタデータ抽出機能のテスト**

   - 正常系: 有効な MP3 ファイルからメタデータが正しく抽出されることを確認
   - 異常系: 無効なファイルの場合、デフォルト値が返されることを確認
   - 境界値: 特殊文字を含むファイル名、非常に大きなファイル、メタデータのない/不完全なファイル

5. **複数ファイルのメタデータ一括抽出機能のテスト**
   - 正常系: 複数の MP3 ファイルからメタデータが正しく抽出されることを確認
   - 異常系: 一部のファイルが無効な場合でも、有効なファイルのメタデータが抽出されることを確認
   - パフォーマンス: 大量のファイルを処理する場合のパフォーマンスを確認

```typescript
// メタデータ抽出機能のテスト例
test("有効なMP3ファイルからメタデータを抽出できる", async () => {
  const testFilePath = path.join(__dirname, "fixtures", "test.mp3");
  const metadata = await getMetadata(testFilePath);

  expect(metadata).toHaveProperty("title");
  expect(metadata).toHaveProperty("artist");
  expect(metadata).toHaveProperty("duration");
});
```

### 8.2 結合テスト

1. **レンダラープロセスとメインプロセス間の通信テスト**

   - IPC 通信が正しく機能することを確認
   - ファイル選択ダイアログからメタデータ抽出までの一連の流れをテスト
   - フォルダー選択から MP3 ファイルスキャン、メタデータ抽出までの一連の流れをテスト

2. **ローカルファイル再生機能のテスト**

   - 選択されたファイルが正しく再生されることを確認
   - 再生コントロール（再生、一時停止、シーク）が機能することを確認

3. **テーブル表示コンポーネントのテスト**

   - ファイルリストが正しく表示されることを確認
   - ソート機能が正しく動作することを確認
   - リスト内の曲をクリックすると再生されることを確認

4. **進捗表示コンポーネントのテスト**
   - メタデータ抽出の進捗状況が正しく表示されることを確認

```typescript
// IPC通信のテスト例
test("ファイル選択からメタデータ抽出までの流れ", async () => {
  // モックの設定
  const mockFilePaths = ["/path/to/test.mp3"];
  const mockMetadata = {
    title: "Test Song",
    artist: "Test Artist",
    duration: 180,
  };

  // ダイアログのモック
  electron.dialog.showOpenDialog.mockResolvedValue({
    canceled: false,
    filePaths: mockFilePaths,
  });

  // メタデータ抽出のモック
  jest.spyOn(metadataModule, "getMetadata").mockResolvedValue(mockMetadata);

  // テスト対象の関数を実行
  const result = await handleSelectFiles();

  // 検証
  expect(result).toEqual([mockMetadata]);
  expect(electron.dialog.showOpenDialog).toHaveBeenCalledWith(
    expect.objectContaining({
      properties: ["openFile", "multiSelections"],
    })
  );
  expect(metadataModule.getMetadata).toHaveBeenCalledWith(mockFilePaths[0]);
});
```

### 8.3 E2E テスト

1. **実際の MP3 ファイルを使用した再生機能のテスト**

   - テスト用の MP3 ファイルを用意
   - ファイル選択 → メタデータ表示 → 再生 → 一時停止 → シークの一連の流れをテスト

2. **フォルダー選択機能のテスト**

   - テスト用のフォルダー構造を用意
   - フォルダー選択 → MP3 ファイルスキャン → メタデータ抽出 → テーブル表示の一連の流れをテスト
   - 進捗表示が正しく機能することを確認

3. **テーブル表示機能のテスト**

   - 大量の MP3 ファイルを含むフォルダーを選択
   - テーブル表示の各列でソートが正しく機能することを確認
   - テーブル内の曲をクリックして再生できることを確認

4. **プレイリスト機能のテスト**

   - 複数の MP3 ファイルを選択
   - 次の曲/前の曲への移動をテスト
   - シャッフル/リピート機能をテスト

5. **サイドバーの「ローカル」タブのテスト**

   - サイドバーの「ローカル」タブをクリックしてローカルファイル管理ページに移動できることを確認

6. **異なるプラットフォームでのテスト**
   - Windows、macOS、Linux での動作確認
   - ファイルパスの違いによる問題がないことを確認

```typescript
// E2Eテスト例（Playwright使用）
test("MP3ファイルの再生テスト", async ({ page }) => {
  // アプリケーションを起動（Electronアプリケーションの場合は専用の設定が必要）
  await page.goto("app://localhost/");

  // サイドバーの「ローカル」タブをクリック
  await page.click('text="ローカル"');

  // ローカルファイル選択ボタンをクリック
  await page.click('button:has-text("ローカルファイルを選択")');

  // ファイル選択ダイアログでファイルを選択（モック）
  // Electronアプリケーションのダイアログはモックする必要がある
  await mockFileSelection(page, ["/path/to/test.mp3"]);

  // ファイルリストに表示されることを確認
  await expect(page.locator("table tbody tr")).toHaveCount(1);
  await expect(page.locator("table tbody tr td:nth-child(2)")).toContainText(
    "test.mp3"
  );

  // 再生ボタンをクリック
  await page.click("table tbody tr");

  // 再生状態になることを確認
  const isPlaying = await page.evaluate(() => {
    return document.querySelector("audio").paused === false;
  });
  expect(isPlaying).toBe(true);
});

// フォルダー選択テスト
test("フォルダー選択とテーブル表示のテスト", async ({ page }) => {
  // アプリケーションを起動
  await page.goto("app://localhost/");

  // サイドバーの「ローカル」タブをクリック
  await page.click('text="ローカル"');

  // フォルダー選択タブが選択されていることを確認
  await expect(page.locator('[role="tab"][aria-selected="true"]')).toHaveText(
    "フォルダーから追加"
  );

  // フォルダー選択ボタンをクリック
  await page.click('button:has-text("音楽フォルダーを選択")');

  // フォルダー選択ダイアログでフォルダーを選択（モック）
  await mockFolderSelection(page, "/path/to/music");

  // 進捗表示が表示されることを確認
  await expect(page.locator("text=/ファイル処理中/")).toBeVisible();

  // メタデータ抽出が完了するのを待つ
  await page.waitForSelector("text=/ファイル処理中/", { state: "hidden" });

  // テーブルにファイルが表示されることを確認
  await expect(page.locator("table tbody tr")).toHaveCount.greaterThan(0);

  // テーブルのソート機能をテスト
  // 曲名でソート
  await page.click('th:has-text("曲名")');

  // ソートされたことを確認（最初の行の曲名を取得）
  const firstSongTitle = await page
    .locator("table tbody tr:first-child td:nth-child(2)")
    .textContent();

  // 再度クリックして逆順にソート
  await page.click('th:has-text("曲名")');

  // 逆順にソートされたことを確認（最初の行の曲名が変わっていることを確認）
  const firstSongTitleAfterReverse = await page
    .locator("table tbody tr:first-child td:nth-child(2)")
    .textContent();
  expect(firstSongTitle).not.toEqual(firstSongTitleAfterReverse);

  // テーブル内の曲をクリックして再生
  await page.click("table tbody tr:first-child");

  // 再生状態になることを確認
  const isPlaying = await page.evaluate(() => {
    return document.querySelector("audio").paused === false;
  });
  expect(isPlaying).toBe(true);
});
```
