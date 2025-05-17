# package.jsonへの変更点

既存のpackage.jsonに以下の変更を加える必要があります：

## 1. メインエントリポイントの追加

```json
"main": "electron/main.js",
```

## 2. スクリプトの追加/変更

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "test": "jest",
  
  "dev:electron": "concurrently \"next dev\" \"electron-esbuild dev\"",
  "build:electron": "next build && next export && electron-esbuild build",
  "package:electron": "electron-builder",
  "dist:electron": "npm run build:electron && npm run package:electron"
},
```

## 3. 依存関係の追加

```json
"devDependencies": {
  // 既存の依存関係に加えて
  "electron": "^28.1.0",
  "electron-builder": "^24.9.1",
  "electron-esbuild": "^9.0.0",
  "concurrently": "^8.2.2",
  "wait-on": "^7.2.0"
},
"dependencies": {
  // 既存の依存関係に加えて
  "electron-serve": "^1.2.0",
  "electron-store": "^8.1.0"
},
```

## 4. next.config.jsの変更

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-e2a37609c94e4d128a7638f0e5ebe05e.r2.dev",
      },
      {
        protocol: "https",
        hostname: "pub-5cf6f4d1134946fc9b0ae6736c735478.r2.dev",
      },
    ],
    unoptimized: true,
  },
  experimental: {
    forceSwcTransforms: true,
  },
  // Electronでの使用のために追加
  output: "export",
};

module.exports = nextConfig;
```

## 5. electron-esbuild.config.jsの作成

以下の内容で`electron-esbuild.config.js`ファイルを作成します：

```js
module.exports = {
  main: {
    entryPoints: ['electron/main.ts'],
    outfile: 'electron/main.js',
    external: ['electron'],
    platform: 'node',
    target: 'node16',
    format: 'cjs',
    bundle: true,
    sourcemap: 'inline',
  },
  preload: {
    entryPoints: ['electron/preload.ts'],
    outfile: 'electron/preload.js',
    external: ['electron'],
    platform: 'node',
    target: 'node16',
    format: 'cjs',
    bundle: true,
    sourcemap: 'inline',
  },
};
```

## 6. tsconfig.jsonの変更

既存のtsconfig.jsonに以下の設定を追加します：

```json
{
  "compilerOptions": {
    // 既存の設定に加えて
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": [
    "next-env.d.ts", 
    "**/*.ts", 
    "**/*.tsx", 
    ".next/types/**/*.ts",
    "electron/**/*.ts"  // Electronのファイルを含める
  ],
  "exclude": ["node_modules"]
}
```

## 7. Electronアプリケーションの設定

以下のファイルを作成する必要があります：

1. `electron/main.ts` - メインプロセスのコード
2. `electron/preload.ts` - プリロードスクリプト
3. `electron/electron-env.d.ts` - 型定義
4. `electron-builder.yml` - ビルド設定

これらのファイルは既に作成済みです。
