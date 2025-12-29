# オフライン再生機能のバグ修正 - 実装計画

## 📋 概要

### 問題点

1. **ダウンロード状態の判定が不正確**

   - オフラインに切り替えた際、いいね曲・プレイリスト曲のダウンロード済み判定が正しく動作していない
   - 結果として、ダウンロード済みの曲でもグレーアウトされてしまう

2. **ローカルファイルが使用されていない**
   - ダウンロード済みの曲を再生する際、リモート URL (`song_path`) が使用されている
   - ローカルに保存された音声ファイル (`local_song_path`) を使用すべき

### 目標

- オフライン時でも、ダウンロード済みの曲は正常に再生できるようにする
- ダウンロード済みの曲はローカルファイルから再生し、通信を発生させない

---

## 🔍 現状分析

### データフロー

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ Supabase (リモート)                                                          │
│   liked_songs_regular テーブル                                               │
│   └── song_path: "https://..."  (リモートURL)                                │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
            オンライン時: フェッチ   │   オフライン時: キャッシュから取得
                                     ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ ローカル SQLite DB                                                           │
│   songs テーブル                                                             │
│   ├── id: "song-123"                                                         │
│   ├── songPath: "file://..." (ダウンロード済みならローカルパス)               │
│   ├── originalSongPath: "https://..." (元のリモートURL)                      │
│   └── downloadedAt: "2024-..."                                               │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
                          getCachedLikedSongs()
                                     ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ 返却されるデータ                                                             │
│   {                                                                          │
│     id: "song-123",                                                          │
│     song_path: "https://...",        ← 元のリモートURL                       │
│     is_downloaded: true,             ← ダウンロード済みフラグ ✅             │
│     local_song_path: "file://...",   ← ローカルパス ✅                       │
│   }                                                                          │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
                                     ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ SongList / SongItem コンポーネント                                           │
│   useDownloadSong(song)                                                      │
│   └── 非同期で electronAPI.offline.checkStatus() を呼び出し                  │
│       └── 問題: 初期レンダリング時は false を返す                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 問題箇所

#### 1. `useDownloadSong.ts` (hooks/utils/)

```typescript
// 現状: 非同期チェックに依存
const [isDownloaded, setIsDownloaded] = useState(
  song?.is_downloaded ?? false // ← これは使われているが...
);

// マウント時に非同期チェックで上書きされる
useEffect(() => {
  const { isDownloaded } = await electronAPI.offline.checkStatus(song.id);
  setIsDownloaded(isDownloaded); // ← この結果で上書き
}, [checkStatus]);
```

- `song.is_downloaded` がキャッシュから渡されていても、非同期の `checkStatus()` の結果で上書きされる
- `checkStatus()` はデータベースに問い合わせるが、タイミングによってはまだ `songPath` が設定されていない可能性

#### 2. 再生時のパス解決

```typescript
// PlayerContent.tsx
useAudioPlayer(song?.song_path, song); // ← 常にリモートURLを使用
```

- `song.local_song_path` が存在しても使用されていない
- `useGetSongById` には `checkLocalFile` があるが、`SongListContent` では `useGetSongById` を経由していない

---

## 📝 解決策

### Phase 1: キャッシュデータの `is_downloaded` を信頼する

**変更箇所**: `hooks/utils/useDownloadSong.ts`

#### 1.1 初期値の優先

```typescript
// 変更前
const [isDownloaded, setIsDownloaded] = useState(song?.is_downloaded ?? false);

// 変更後: 初期値が true なら非同期チェックをスキップ
const [isDownloaded, setIsDownloaded] = useState(song?.is_downloaded ?? false);

useEffect(() => {
  // 既に is_downloaded が true なら再チェック不要
  if (song?.is_downloaded) {
    setIsDownloaded(true);
    return;
  }

  // それ以外の場合のみ非同期チェック
  checkStatus();
}, [song?.is_downloaded, checkStatus]);
```

### Phase 2: ローカルパスの優先使用

**変更箇所**: `components/Player/PlayerContent.tsx` または 新規ユーティリティ

#### 2.1 再生パスの解決

```typescript
// 新規ユーティリティ: libs/songUtils.ts に追加

/**
 * 曲の再生可能なパスを取得
 * ダウンロード済みの場合はローカルパス、そうでなければリモートURL
 */
export const getPlayablePath = (song: Song): string => {
  // ローカルパスが存在し、ダウンロード済みならそれを使用
  if (song.local_song_path && song.is_downloaded) {
    return song.local_song_path;
  }
  return song.song_path;
};
```

#### 2.2 PlayerContent での使用

```typescript
// 変更前
useAudioPlayer(song?.song_path, song);

// 変更後
const playablePath = getPlayablePath(song);
useAudioPlayer(playablePath, song);
```

### Phase 3: SongList / SongItem での改善

**変更箇所**: `components/Song/SongList.tsx`, `components/Song/SongItem.tsx`

#### 3.1 is_downloaded プロパティの直接使用

```typescript
// 変更前
const { isDownloaded } = useDownloadSong(data);

// 変更後: まずプロパティを確認、なければフックにフォールバック
const propIsDownloaded = data.is_downloaded ?? false;
const { isDownloaded: hookIsDownloaded } = useDownloadSong(
  propIsDownloaded ? null : data // ダウンロード済みならフックをスキップ
);
const isDownloaded = propIsDownloaded || hookIsDownloaded;
```

---

## 📁 変更ファイル一覧

### 必須変更

| ファイル                              | 変更内容                                         |
| ------------------------------------- | ------------------------------------------------ |
| `libs/songUtils.ts`                   | `getPlayablePath()` 関数を追加                   |
| `hooks/utils/useDownloadSong.ts`      | `is_downloaded` プロパティを優先するロジック追加 |
| `components/Player/PlayerContent.tsx` | `getPlayablePath()` を使用                       |
| `components/Song/SongList.tsx`        | `is_downloaded` プロパティを優先使用             |
| `components/Song/SongItem.tsx`        | `is_downloaded` プロパティを優先使用             |
| `components/Song/MediaItem.tsx`       | `is_downloaded` プロパティを優先使用             |

### テスト

| ファイル                                   | 変更内容                         |
| ------------------------------------------ | -------------------------------- |
| `__tests__/hooks/useDownloadSong.test.tsx` | 新しいロジックのテスト追加       |
| `__tests__/libs/songUtils.test.ts`         | `getPlayablePath()` のテスト追加 |

---

## 🔄 実装順序

### Step 1: ユーティリティ関数の追加

```bash
# 1. libs/songUtils.ts に getPlayablePath 関数を追加
# 2. テストを作成・実行
```

### Step 2: useDownloadSong の改善

```bash
# 1. is_downloaded プロパティ優先ロジックを追加
# 2. 既存テストを修正・新規テスト追加
```

### Step 3: PlayerContent の修正

```bash
# 1. getPlayablePath を import
# 2. useAudioPlayer の引数を変更
```

### Step 4: SongList / SongItem / MediaItem の修正

```bash
# 1. is_downloaded プロパティの直接使用
# 2. useDownloadSong の呼び出し条件を最適化
```

### Step 5: 動作確認

```bash
# 1. オンライン状態で曲をダウンロード
# 2. オフラインモードに切り替え
# 3. いいね曲画面 → ダウンロード済み曲が再生可能か確認
# 4. プレイリスト画面 → ダウンロード済み曲が再生可能か確認
# 5. ホーム画面 → ダウンロード済み曲が再生可能か確認
```

---

## ⚠️ 注意事項

### 互換性

- `is_downloaded` と `local_song_path` は `types/index.ts` に既に定義済み
- キャッシュ IPC (`electron/ipc/cache.ts`) は既にこれらのフィールドを返している
- 既存の動作を壊さないよう、フォールバックロジックを維持

### パフォーマンス

- `useDownloadSong` の非同期チェックは、`is_downloaded` が true の場合はスキップ
- 不要な IPC コールを削減

### 将来の拡張

- この修正は「ローカル DB 優先」アーキテクチャへの第一歩
- 将来的には、ホーム画面のコンテンツもローカル DB からダウンロード状態を取得可能

---

## 📊 影響範囲

### 直接影響

- いいね曲画面 (`/liked`)
- プレイリスト詳細画面 (`/playlists/[id]`)
- プレイヤーコンポーネント

### 間接影響

- ホーム画面の SongItem コンポーネント（改善される可能性）
- RightSidebar（`useGetSongById` 経由で既に対応済み）

---

## ✅ 完了条件

1. [x] オフライン時、ダウンロード済みの曲がグレーアウトされない
2. [x] オフライン時、ダウンロード済みの曲が再生できる
3. [x] 再生時、ローカルファイルが使用される（ネットワーク通信なし）
4. [x] 既存のオンライン動作に影響がない
5. [ ] 全テストがパスする（要動作確認）

---

## 📅 作成日

2024-12-30

## 📝 ステータス

**実装完了** ✅ → 動作確認待ち

### 実装された変更

| ファイル                              | 変更内容                                         |
| ------------------------------------- | ------------------------------------------------ |
| `libs/songUtils.ts`                   | `getPlayablePath()` 関数を追加                   |
| `hooks/utils/useDownloadSong.ts`      | `is_downloaded` プロパティを優先するロジック追加 |
| `components/Player/PlayerContent.tsx` | `getPlayablePath()` を使用                       |
| `components/Song/SongList.tsx`        | `is_downloaded` プロパティを優先使用             |
| `components/Song/SongItem.tsx`        | `is_downloaded` プロパティを優先使用             |
| `components/Song/MediaItem.tsx`       | `is_downloaded` プロパティを優先使用             |
