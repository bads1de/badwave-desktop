# Badwave Windows: Offline Implementation Plan

このドキュメントでは、`badwave-windows` のオフライン機能の実装計画を定義します。

## 1. 方針: シンプルなオフライン専用ページ方式

Spotify と同様のシンプルなモデルを採用します。複雑な同期ロジックを避け、**オフライン時は専用ページにリダイレクト**し、ダウンロード済みの曲のみを表示・再生可能にします。

### 設計原則

1. **ローカル DB には最小限のデータのみ保存**: ダウンロード済みの曲だけ
2. **いいね/プレイリストの同期は行わない**: オンライン時のみ利用可能
3. **オフライン時は専用ページへ**: 通常の UI は使用せず、シンプルなオフライン UI を表示

---

## 2. オフライン時の動作

```
[ネットワーク切断検知]
   ↓
useNetworkStatus が isOnline = false を返す
   ↓
/offline ページにリダイレクト
   ↓
ダウンロード済みの曲一覧を表示 (ローカルDB から)
   ↓
曲を選択 → file:// プロトコルで再生
```

### オフライン時の UI

| 画面                              | 動作                                   |
| :-------------------------------- | :------------------------------------- |
| **ホーム/検索/トレンド**          | アクセス不可 → /offline にリダイレクト |
| **マイライブラリ (オンライン版)** | アクセス不可 → /offline にリダイレクト |
| **/offline ページ**               | ダウンロード済みの曲一覧を表示         |
| **プレイヤー**                    | ダウンロード済みの曲のみ再生可能       |

### オンライン時の UI

| 画面                   | 動作                             |
| :--------------------- | :------------------------------- |
| **すべてのページ**     | 通常通り Supabase からデータ取得 |
| **ダウンロードボタン** | 曲をローカルに保存 + DB に登録   |
| **/offline ページ**    | アクセス可能（事前確認用）       |

---

## 3. Database Design (Drizzle ORM)

ローカル DB には**ダウンロード済みの曲のみ**保存します。いいねやプレイリストは保存しません。

```typescript
import { sqliteTable, text, real, integer } from "drizzle-orm/sqlite-core";

// ダウンロード済みの曲のみを管理
export const songs = sqliteTable("songs", {
  id: text("id").primaryKey(), // Supabase UUID
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  author: text("author").notNull(),

  // ローカルファイルパス (必須 - ダウンロード済みのみ保存するため)
  songPath: text("song_path").notNull(), // file://...
  imagePath: text("image_path"), // file://...

  // 元のリモートURL (再ダウンロード用)
  originalSongPath: text("original_song_path"),
  originalImagePath: text("original_image_path"),

  duration: real("duration"),
  genre: text("genre"),
  lyrics: text("lyrics"),

  createdAt: text("created_at"),
  downloadedAt: integer("downloaded_at", { mode: "timestamp" }),
});
```

**Note**: いいね/プレイリスト用のテーブルは不要になりました。

---

## 4. Electron IPC Channels

### `download-song` (Renderer → Main)

- **引数**: `song: Song` (Supabase から取得した曲オブジェクト)
- **処理**:
  1. MP3 をダウンロード → `AppData/offline_storage/songs/{id}.mp3`
  2. 画像をダウンロード → `AppData/offline_storage/images/{id}.jpg`
  3. SQLite の `songs` テーブルに INSERT
- **戻り値**: `{ success: boolean, localPath: string }`

### `get-offline-songs` (Renderer → Main)

- **引数**: なし (または検索フィルタ)
- **処理**: SQLite から全曲を SELECT
- **戻り値**: `Song[]`

### `delete-offline-song` (Renderer → Main)

- **引数**: `songId: string`
- **処理**: ファイル削除 + DB DELETE
- **戻り値**: `{ success: boolean }`

### `check-offline-status` (Renderer → Main)

- **引数**: `songId: string`
- **処理**: DB に存在するかチェック
- **戻り値**: `boolean`

---

## 5. Implementation Roadmap

### Phase 1: Foundation (完了済み ✅)

- [x] Drizzle ORM セットアップ
- [x] `electron/db/schema.ts` 作成
- [x] `electron/db/client.ts` 作成
- [x] マイグレーション設定

### Phase 2: IPC ハンドラー実装 (完了済み ✅)

- [x] `download-song` IPC の実装
- [x] `get-offline-songs` IPC の実装
- [x] `delete-offline-song` IPC の実装
- [x] `check-offline-status` IPC の実装

### Phase 3: オフライン専用ページ (完了済み ✅)

- [x] `/offline` ページの作成
- [x] ダウンロード済み曲一覧の UI
- [x] オフライン時の自動リダイレクト (`useNetworkStatus` 活用)
- [x] オフライン用プレイヤー UI

### Phase 4: ダウンロード機能の UI (完了済み ✅)

- [x] 既存の `useDownloadSong` を新 IPC に接続
- [x] ダウンロード済みアイコン表示

---

## 6. Technical Notes

- **DRM**: 考慮しない (DRM フリー)
- **Security**: ファイルは `app.getPath('userData')` 内に保存
- **Monorepo**: スキーマは `drizzle-orm/sqlite-core` のみ依存し、モバイル版でも再利用可能
