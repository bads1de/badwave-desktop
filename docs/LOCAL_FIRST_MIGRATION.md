# ローカルファースト アーキテクチャ移行計画

このドキュメントは、Spotify や Apple Music のデスクトップアプリを参考に、`badwave-windows` をローカルファーストアーキテクチャへ移行するための計画書です。

## 1. 現状の課題

現在のアプリケーションは、ネットワーク接続状態によってデータソースを切り替えています。

- **オンライン**: Supabase から取得 → ローカル DB (SQLite) に同期
- **オフライン**: ローカル DB から取得

**重大な問題点**: オンライン時に Supabase からデータを取得すると、レスポンスに「ダウンロード済みフラグ (`is_downloaded`)」や「ローカルパス (`local_song_path`)」が含まれていません。このため、アプリはファイルがダウンロード済みである情報を見失い、再生不能になったり、誤ってストリーミングしようとしたりします。

## 2. 目標アーキテクチャ: ローカルファースト

**「表示はローカル DB から、同期はバックグラウンドで」** という戦略を採用します。

### 基本原則

1. **UI は常にローカル DB から読み込む**:
   UI コンポーネントは、オンライン/オフラインに関わらず、_常に_ Electron IPC 経由でローカル SQLite データベースからデータを取得します。

   - ゼロレイテンシ（爆速表示）
   - データ構造の一貫性（常に `is_downloaded` ステータスを含む）
   - デフォルトでオフライン対応

2. **バックグラウンド同期**:
   Supabase から最新データを取得し、ローカル DB を更新（Upsert）するロジックを分離します。
   - アプリ起動時、オンライン復帰時、または明確なユーザーアクション時にトリガー。
   - 更新完了後、React Query のキャッシュを無効化して UI に最新データを反映。

```mermaid
graph TD
    UI[UI Component] -->|1. 読み込み (IPC)| LocalDB[(SQLite Local DB)]
    UI -->|2. 同期トリガー| SyncHook[useSyncXXX Hook]
    SyncHook -->|3. 最新取得| Supabase((Supabase))
    SyncHook -->|4. データ保存 (Upsert)| LocalDB
    SyncHook -.->|5. 再描画要求| UI
```

## 3. スコープ

オフライン再生が特に重要な以下の「ライブラリ」機能に対して移行を行います。

1. **Liked Songs (お気に入り)** (`useGetLikedSongs`) - **優先度 1**
2. **Playlists List (プレイリスト一覧)** (`useGetPlaylists`)
3. **Playlist Songs (プレイリスト内の曲)** (`useGetPlaylistSongs`)

_注: 検索やホーム画面（トレンドなど）は当面「オンラインファースト」のまま維持します。_

## 4. 実装詳細

### A. IPC ハンドラ (`electron/ipc/cache.ts`)

既存のハンドラ (`get-cached-liked-songs` など) が以下を確実に返すか再確認します（現状の実装はおおむね問題ありません）。

- `is_downloaded: true` （`songPath` が存在する場合）
- `local_song_path`: 絶対パス
- `local_image_path`: 絶対パス

### B. フックの分離

#### パターン

既存の「取得＆同期」を行うフックを 2 つに分割します。

**1. Reader フック (`useGetXXX`)**

- 役割: UI 表示用のデータ取得。
- ロジック:
  - **Electron**: 常に `await electronAPI.cache.getCachedXXX()` を実行。
  - **Web (フォールバック)**: 直接 Supabase から取得。
- Network Mode: `"always"` (オフラインでも動作させるため)。

**2. Syncer フック (`useSyncXXX`) - 新規作成**

- 役割: ローカル DB を最新に保つ。
- ロジック:
  - `isElectron && isOnline` をチェック。
  - Supabase からデータをフェッチ。
  - `electronAPI.cache.syncXXX()` (安全な Upsert) を呼び出す。
    - **重要**: 同期処理が既存の `songPath` や `downloadedAt` を上書きしないことを保証する。
  - 成功時: `queryClient.invalidateQueries(READER_KEY)` を実行。

### C. コンポーネント統合

コンポーネント（例: `SongListContent`, `LibraryPage`）を以下のように更新します：

1. トップレベルで `useSyncXXX()` を呼び出し、バックグラウンド同期を開始。
2. レンダリングには `useGetXXX()` のデータを使用。

## 5. 移行ステップ

### Step 1: Liked Songs (実証実験)

- [x] `hooks/sync/useSyncLikedSongs.ts` を作成。
- [x] `hooks/data/useGetLikedSongs.ts` を読み込み専用にリファクタリング。
- [x] `components/Song/SongListContent.tsx` に統合。
- [x] 「いいね」の切り替えやオンライン/オフライン切り替えで再生が壊れないことを検証。

### Step 2: Playlists

- [x] `hooks/sync/useSyncPlaylists.ts` を作成。
- [x] `hooks/data/useGetPlaylists.ts` をリファクタリング。
- [x] `Sidebar` や `AddPlaylistModal` に統合。

### Step 3: Playlist Songs

- [x] `hooks/sync/useSyncPlaylistSongs.ts` を作成。
- [x] `hooks/data/useGetPlaylistSongs.ts` をリファクタリング。
- [x] `app/playlist/[id]/page.tsx` (または相当箇所) に統合。

## 6. エッジケースと考慮事項

- **初回起動**: ローカル DB は空です。UI は一瞬「空」を表示し、同期が開始されると数秒後にパッと表示されます（ネイティブアプリによくある挙動で、許容範囲内です）。
- **画像**: オンライン時はローカル DB 内のリモート URL を使用。オフライン時、ダウンロード済みの曲についてはキャッシュされた画像パスを使用します。
- **競合**: `better-sqlite3` は同期的であり、フック側でも `useRef` フラグで多重実行を防ぐため、大きな問題にはなりません。

## 7. Phase 2: ホーム画面のローカルファースト化 (計画中)

### 概要

トレンド、スポットライト、レコメンデーションなどの「検索・発見」系データもローカルキャッシュし、オフライン閲覧と高速表示を実現します。これにより、ホーム画面も「まずローカルを表示し、裏で更新」という挙動に統一されます。

### アーキテクチャ変更

1. **スキーマ追加 (`section_cache`)**:
   順序情報を持つリスト（どの曲が、どの順番で表示されるか）を保存するための汎用的なキャッシュテーブルを追加します。

   ```typescript
   // electron/db/schema.ts (案)
   export const sectionCache = sqliteTable("section_cache", {
     key: text("key").primaryKey(), // 例: "home_trends_all", "home_spotlight", "home_foryou"
     songIds: text("song_ids", { mode: "json" }), // 曲IDの順序付き配列
     updatedAt: integer("updated_at", { mode: "timestamp" }),
   });
   ```

2. **データフロー**:
   - **Sync (Background)**:
     1. Supabase から最新リスト（楽曲データ含む）を取得。
     2. 含まれる楽曲データを `songs` テーブルに Upsert (メタデータをローカルに確保)。
     3. 曲 ID のリストを `section_cache` に保存。
   - **Read (UI)**:
     1. `section_cache` から指定された Key の ID リストを取得。
     2. `songs` テーブルから詳細情報を `IN` クエリで一括取得し、ID リスト順にソートして返却。
     3. これにより、`songs` テーブルにある `is_downloaded` や `local_song_path` がホーム画面のデータにも自動的に適用されます。

### 実装ステップ

#### Step 1: Schema & IPC

- [ ] `electron/db/schema.ts` に `section_cache` を追加。
- [ ] `drizzle-kit generate:sqlite` でマイグレーションファイル作成。
- [ ] IPC ハンドラ `get-section-songs` (Key -> Song[]) を `electron/ipc/cache.ts` に実装。
- [ ] IPC ハンドラ `sync-section` (Key, Song[]) を実装。

#### Step 2: Trends (トレンド)

- [ ] `hooks/sync/useSyncTrends.ts` 作成。
- [ ] `hooks/data/useGetTrendSongs.ts` を IPC 経由で取得するように修正。
- [ ] `app/(site)/page.tsx` で Sync フックを呼び出し。

#### Step 3: Spotlight & Latest

- [ ] `hooks/sync/useSyncSpotlight.ts` 作成。
- [ ] `hooks/sync/useSyncLatest.ts` 作成。
- [ ] 各取得フック (`useGetSpotlight`, `useGetSongs`) を修正。

#### Step 4: For You (Personalized)

- [ ] `hooks/sync/useSyncRecommendations.ts` 作成。
- [ ] `useGetRecommendations` をローカル対応。

### 考慮事項 (Garbage Collection)

「検索・発見」系のデータが `songs` テーブルに追加され続けると、ユーザーが「いいね」しておらず、かつ現在のトレンド等からも消えた「ゴミ」楽曲データが `songs` テーブルに蓄積していきます。
将来的には、以下の条件をすべて満たす `songs` レコードを定期削除するクリーンアップ処理（GC）が必要になります。

1. `liked_songs` テーブルに存在しない。
2. `playlist_songs` テーブルに存在しない。
3. `is_downloaded` が false（ファイル実体を持たない）。
4. `section_cache` のいずれのリストにも含まれていない。
