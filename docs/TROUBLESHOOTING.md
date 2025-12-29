# Electron 開発環境トラブルシューティングガイド

## よくある問題と対処法

### 1. ChunkLoadError / SyntaxError: Invalid or unexpected token

**症状:**

```
ChunkLoadError: Loading chunk app/layout failed.
(timeout: http://localhost:3000/_next/static/chunks/app/layout.js)
```

または

```
Uncaught SyntaxError: Invalid or unexpected token (at layout.js:XXX:XX)
```

**考えられる原因:**

1. Next.js 開発サーバーがまだコンパイル中に Electron がアクセスした
2. キャッシュ不整合
3. ファイルロック（他のプロセスがファイルを使用中）
4. ポート競合（複数のプロセスがポート 3000 を使用しようとしている）

**対処法:**

```powershell
# 1. 全プロセスを終了
# Ctrl+C で npm run dev:electron を終了

# 2. ポート3000を使用しているプロセスを確認・終了
netstat -ano | findstr :3000
# 表示されたPIDを確認して終了
taskkill /PID <PID> /F

# 3. .next キャッシュを削除
Remove-Item -Recurse -Force .next

# 4. 再起動
npm run dev:electron
```

---

### 2. TypeError: Cannot read properties of undefined (reading 'length')

**症状:**

```
[Sync] Liked Songs Error: TypeError: Cannot read properties of undefined (reading 'length')
```

**原因:**
IPC 通信で関数の引数形式が不一致。

**対処法:**
`hooks/utils/useBackgroundSync.ts` で関数呼び出しがオブジェクト形式になっているか確認:

```typescript
// 正しい形式
await electronAPI.cache.syncLikedSongs({ userId: user.id, songs });
await electronAPI.cache.syncPlaylistSongs({
  playlistId: String(playlist.id),
  songs,
});

// 間違った形式（エラーになる）
await electronAPI.cache.syncLikedSongs(user.id, songs);
await electronAPI.cache.syncPlaylistSongs(playlistId, songs);
```

---

### 3. ホーム画面のデータがフェッチされない

**症状:**

- "For You" や "Public Playlists" が "Please wait" のまま

**考えられる原因:**

1. 上記の ChunkLoadError が発生している
2. ユーザーがログインしていない（一部のセクションはログイン必須）
3. ネットワーク/Supabase 接続の問題

**対処法:**

1. DevTools Console でエラーを確認
2. Network タブでリクエストが失敗していないか確認
3. 上記の ChunkLoadError 対処法を試す

---

## デバッグ用チェックリスト

問題が発生したら、以下を順番に確認:

- [ ] DevTools Console にエラーがあるか確認
- [ ] 長時間実行中のプロセスがないか確認 (`Get-Process pwsh`)
- [ ] ポート 3000 が空いているか確認 (`netstat -ano | findstr :3000`)
- [ ] `.next` フォルダを削除して再起動
- [ ] `node_modules/.cache` を削除して再起動
- [ ] Electron TypeScript をリビルド (`npm run build:electron`)

---

## 完全リセット手順

上記で解決しない場合:

```powershell
# 全キャッシュ削除
Remove-Item -Recurse -Force .next, node_modules/.cache -ErrorAction SilentlyContinue

# Electron TypeScript リビルド
npm run build:electron

# 再起動
npm run dev:electron
```
