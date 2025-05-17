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
