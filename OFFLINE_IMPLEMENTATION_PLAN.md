# Badwave Windows: Offline Implementation Plan

このドキュメントでは、Spotify のような「オフラインファースト」のアーキテクチャを `badwave-windows` に実装するための計画を定義します。

## 1. Architecture Overview (アーキテクチャ概要)

現在の「Supabase から常にデータを取得する」方式から、「**ローカルデータベース (SQLite) を正 (Source of Truth) として扱い、必要に応じてクラウドと同期する**」方式へ移行します。

### Current Flow (As-Is)

- **Fetch**: UI -> TanStack Query -> Supabase (Remote)
- **Play**: UI -> Audio Player -> URL Streaming
- **Offline**: 未対応 (キャッシュがある場合のみ表示されるが再生は不可)

### Target Flow (To-Be)

- **Data Management**:
  - メタデータは `SQLite` で管理。
  - 音楽ファイル (MP3) と画像はローカルファイルシステム (`AppData`) に保存。
- **Fetch Strategy (Hybrid)**:
  1. まず **ローカル DB** を確認 (`SELECT * FROM songs WHERE ...`).
  2. データがあればそれを即座に返す (高速・オフライン対応).
  3. なければ (かつオンラインなら) Supabase へフェッチしに行く.
- **Download**:
  - ユーザーが「ダウンロード」を押すと、ファイルを保存し、DB にメタデータを登録する。

---

## 2. Database Design (SQLite Schema)

Electron のメインプロセスで `better-sqlite3` を使用して管理します。
`types/index.ts` の `Song` 型に基づき、以下のテーブルを作成します。

### Table: `songs`

ダウンロード済みの楽曲を管理します。

| Column Name           | Type      | Description                               |
| :-------------------- | :-------- | :---------------------------------------- |
| `id`                  | TEXT (PK) | Supabase の uuid と一致                   |
| `user_id`             | TEXT      | 所有者の ID                               |
| `title`               | TEXT      | 曲名                                      |
| `author`              | TEXT      | アーティスト名                            |
| `song_path`           | TEXT      | **ローカルのファイルパス** (`file://...`) |
| `image_path`          | TEXT      | **ローカルの画像パス** (`file://...`)     |
| `original_song_path`  | TEXT      | 元の Supabase URL (再ダウンロード用)      |
| `original_image_path` | TEXT      | 元の Supabase URL                         |
| `duration`            | REAL      | 曲の長さ                                  |
| `genre`               | TEXT      | ジャンル                                  |
| `lyrics`              | TEXT      | 歌詞データ                                |
| `created_at`          | TEXT      | 作成日                                    |
| `downloaded_at`       | INTEGER   | ダウンロード日時 (ソート用)               |

※ 将来的には `artists`, `albums`, `playlists` テーブルに正規化することも可能ですが、まずは `songs` テーブル単独で「マイライブラリ」を実現します。

---

## 3. Electron IPC Channels (通信設計)

レンダラープロセス (React) とメインプロセス (Node.js) の間の通信チャネルを定義します。

### `download-song` (Renderer -> Main)

- **引数**: `song: Song` (Supabase から取得した曲オブジェクト)
- **処理**:
  1. `song.song_path` (URL) から MP3 をダウンロード -> `AppData/offline_storage/songs/{id}.mp3` に保存。
  2. `song.image_path` (URL) から画像をダウンロード -> `AppData/offline_storage/images/{id}.jpg` に保存。
  3. SQLite の `songs` テーブルにメタデータを `INSERT` (パスは `file://` に書き換え)。
- **戻り値**: `success: boolean`, `localSong: Song`

### `get-offline-songs` (Renderer -> Main)

- **引数**: `{ filter?: { artist?: string, genre?: string } }`
- **処理**: SQLite から条件に合う曲を `SELECT` して返す。
- **戻り値**: `Song[]` (ローカルパスを含む)

### `delete-offline-song` (Renderer -> Main)

- **引数**: `songId: string`
- **処理**:
  1. ファイルシステムから MP3 と画像を削除。
  2. SQLite からレコードを `DELETE`。
- **戻り値**: `success: boolean`

### `check-offline-status` (Renderer -> Main)

- **引数**: `songId: string`
- **処理**: 指定された曲が DB (およびファイル) に存在するかチェック。
- **戻り値**: `isDownloaded: boolean`

---

## 4. Refactoring Hooks & Actions

### 4.1. `hooks/useDownloadSong.ts` (New/Refactor)

Supabase Storage からの URL 取得ではなく、本格的なダウンロード処理へ移行します。

```typescript
// 擬似コード
const useDownloadSong = () => {
  return useMutation({
    mutationFn: async (song: Song) => {
      // IPC経由でメインプロセスにダウンロード指示
      return await window.electron.downloadSong(song);
    },
    onSuccess: () => {
      // キャッシュ無効化 (ライブラリ更新のため)
      queryClient.invalidateQueries(["offline-songs"]);
    },
  });
};
```

### 4.2. `hooks/data/useGetSongs.ts` & `actions/getSongs.ts` (Hybrid Fetch)

「ローカル優先」のロジックを組み込みます。

```typescript
// actions/getSongs.ts の改修イメージ
const getSongs = async (isOfflineMode: boolean) => {
  // 1. まずローカルDBを確認
  const localSongs = await window.electron.getOfflineSongs();

  // 2. オフラインモード または 特定のフィルタならローカルのみ返す
  if (isOfflineMode) return localSongs;

  // 3. オンラインなら Supabase もフェッチしてマージ (あるいはUIで分ける)
  // ...
};
```

---

## 5. Implementation Roadmap

### Phase 1: Foundation (足場固め)

1. `better-sqlite3` のインストールと Electron ビルド設定の調整。
2. メインプロセスでの DB 初期化 (`CREATE TABLE`) 実装。
3. `DatabaseService` クラスの作成。

### Phase 2: Core Features (保存と再生)

1. IPC `download-song` の実装 (ファイル保存 + DB Insert)。
2. UI に「ダウンロードボタン」を設置し、`useDownloadSong` フックと連携。
3. IPC `get-offline-songs` の実装。
4. 「ライブラリ」画面でローカル DB の曲を表示できるようにする。

### Phase 3: Integration (統合)

1. プレイヤー (`useAudioPlayer`) が `file://` プロトコルの URL を再生できるように調整。
2. オフライン時の UI ハンドリング (ネット切断時に自動でローカルライブラリ表示に切り替えなど)。
3. キャッシュ削除 (`delete-offline-song`) の実装。

---

## Technical Notes

- **DRM**: 今回は考慮しない（DRM フリー）。MP3 ファイルはそのまま保存される。
- **Security**: ユーザー自身のライブラリ管理であるため、暗号化は行わないが、ファイルパスは `app.getPath('userData')` 内の隠しフォルダに限定する。
- **Type Safety**: `Song` 型を `ipcRenderer` 経由でも維持できるよう、共有の型定義を活用する。
