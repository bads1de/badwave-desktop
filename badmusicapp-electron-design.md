# badmusicapp Electronデスクトップアプリ化 設計と要件定義

## 1. プロジェクト概要

### 1.1 目的
Next.jsで構築された「badmusicapp」をElectronを使用してデスクトップアプリケーション化し、ユーザーがブラウザを開かずに直接アプリケーションとして利用できるようにする。

### 1.2 背景
現在のbadmusicappはNext.jsで構築されたウェブアプリケーションであり、音楽再生、プレイリスト管理などの機能を提供している。デスクトップアプリケーション化することで、以下のメリットが期待できる：

- オフライン環境でも利用可能
- システムの通知機能の活用
- ネイティブアプリケーションのような操作感
- ブラウザを開かずに直接起動可能
- システムトレイからの操作

## 2. 現状分析

### 2.1 現在のアプリケーション構成

#### 2.1.1 フロントエンド
- **フレームワーク**: Next.js 15.2.1
- **UI**: React 19.0.0、Tailwind CSS、Radix UI
- **状態管理**: Zustand
- **データフェッチ**: TanStack Query
- **認証**: Supabase Auth

#### 2.1.2 バックエンド
- **データベース**: Supabase
- **ストレージ**: Cloudflare R2
- **認証**: Supabase Auth
- **API**: Next.js API Routes

#### 2.1.3 主要機能
- 音楽再生
- プレイリスト管理
- ユーザー認証
- 曲の検索・フィルタリング
- お気に入り機能

### 2.2 課題と考慮点
- Next.jsアプリをElectronで動作させるための構成変更
- APIエンドポイントの処理方法（リモート vs ローカル）
- 認証フローの調整
- オフライン機能の実装
- デスクトップ固有機能の追加

## 3. 要件定義

### 3.1 機能要件

#### 3.1.1 基本機能
- 現在のウェブアプリの全機能をデスクトップアプリでも利用可能にする
- アプリケーションの起動・終了
- ウィンドウの最小化・最大化・閉じる

#### 3.1.2 デスクトップ固有機能
- システムトレイへの常駐と制御
- バックグラウンド再生
- システム通知（曲の変更時など）
- グローバルショートカットキー
- 自動アップデート機能
- オフラインモード

#### 3.1.3 データ同期
- オンライン時にSupabaseとデータを同期
- オフライン時にローカルデータを使用
- 再接続時の同期処理

### 3.2 非機能要件

#### 3.2.1 パフォーマンス
- 起動時間: 3秒以内
- メモリ使用量: 最大500MB以内
- CPU使用率: 通常使用時10%以下

#### 3.2.2 互換性
- Windows 10/11
- macOS 11以降
- Linux (Ubuntu 20.04以降)

#### 3.2.3 セキュリティ
- ユーザー認証情報の安全な保存
- APIキーなどの機密情報の保護
- 安全なアップデートメカニズム

## 4. 技術設計

### 4.1 アーキテクチャ

#### 4.1.1 全体構成
- Electron (メインプロセス)
  - Next.js (レンダラープロセス)
  - IPC通信
  - ローカルデータストア

#### 4.1.2 通信フロー
1. レンダラープロセス (Next.js) からのリクエスト
2. IPC通信を通じてメインプロセスへ転送
3. メインプロセスでの処理（APIリクエスト、ファイル操作など）
4. 結果をIPC通信でレンダラープロセスへ返却

### 4.2 技術スタック

#### 4.2.1 デスクトップアプリ化
- **Electron**: アプリケーションのコンテナ
- **electron-builder**: パッケージング・配布
- **electron-store**: 設定・データの永続化

#### 4.2.2 開発ツール
- **TypeScript**: 型安全な開発
- **concurrently**: 開発時の並行実行
- **electron-reload**: 開発時のホットリロード

### 4.3 データフロー

#### 4.3.1 オンラインモード
- Supabaseとの直接通信
- リアルタイムデータ同期

#### 4.3.2 オフラインモード
- ローカルデータの使用
- IndexedDBまたはelectron-storeでのデータキャッシュ
- 再接続時の差分同期

## 5. 実装計画

### 5.1 フェーズ1: 基本構造の構築
- Electron環境の設定
- Next.jsアプリの統合
- 基本的なIPC通信の実装

### 5.2 フェーズ2: 機能実装
- 認証機能の調整
- オフラインモードの実装
- デスクトップ固有機能の追加

### 5.3 フェーズ3: パッケージングと配布
- electron-builderの設定
- 自動アップデート機能の実装
- インストーラーの作成

## 6. 開発環境構築手順

### 6.1 プロジェクト初期化
```bash
# 既存のNext.jsプロジェクトにElectronを追加
cd badwave-windows
npm install --save-dev electron electron-builder concurrently wait-on
npm install electron-serve electron-store
```

### 6.2 ディレクトリ構造
```
badwave-windows/
├── electron/
│   ├── main.ts        # メインプロセス
│   ├── preload.ts     # プリロードスクリプト
│   └── electron-env.d.ts  # 型定義
├── app/               # Next.jsアプリ
├── public/            # 静的ファイル
├── electron-builder.yml  # ビルド設定
└── package.json       # 依存関係と設定
```

### 6.3 設定ファイル
#### package.json
```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:next\" \"npm run dev:electron\"",
    "dev:next": "next dev",
    "dev:electron": "wait-on http://localhost:3000 && electron .",
    "build": "next build && electron-builder",
    "build:next": "next build",
    "build:electron": "electron-builder"
  },
  "main": "electron/main.js"
}
```

## 7. 今後の展望

### 7.1 拡張機能
- システムメディアコントロールとの統合
- 音声認識による操作
- プラグイン機能

### 7.2 配布戦略
- 各プラットフォーム向けインストーラー
- 自動アップデート機能
- クロスプラットフォーム対応

## 8. 参考資料

- [Electron公式ドキュメント](https://www.electronjs.org/docs)
- [Next.js公式ドキュメント](https://nextjs.org/docs)
- [electron-builder公式ドキュメント](https://www.electron.build/)
- [Building Desktop Apps with Electron + Next.JS](https://rbfraphael.medium.com/building-desktop-apps-with-electron-next-js-without-nextron-01bbf1fdd72e)
