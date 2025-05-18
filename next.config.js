/** @type {import('next').NextConfig} */
const path = require("path");

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
  // output: "export", // 静的エクスポートを無効化
  // パスエイリアスの設定
  webpack: (config, { isServer }) => {
    // 既存のエイリアスを保持
    config.resolve.alias = {
      ...config.resolve.alias,
    };

    // 共通のエイリアスを設定
    // tsconfig.jsonの設定と整合性を取る
    // @/* は既にtsconfig.jsonで設定されているので、特定のモジュールのみ追加
    config.resolve.alias["@/libs"] = path.resolve(__dirname, "libs");
    config.resolve.alias["@/components"] = path.resolve(
      __dirname,
      "components"
    );
    config.resolve.alias["@/hooks"] = path.resolve(__dirname, "hooks");
    config.resolve.alias["@/actions"] = path.resolve(__dirname, "actions");
    config.resolve.alias["@/constants"] = path.resolve(__dirname, "constants");
    config.resolve.alias["@/providers"] = path.resolve(__dirname, "providers");
    config.resolve.alias["@/types"] = path.resolve(__dirname, "types");

    return config;
  },
};

module.exports = nextConfig;
