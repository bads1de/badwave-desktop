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

```

### 3.4 ローカルファイルのプレイリスト管理

1. 選択されたローカルファイルをプレイリストとして管理する機能を実装
2. ローカルファイルのプレイリストを保存・読み込みする機能を実装

```typescript

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

```
