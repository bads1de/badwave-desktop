import Link from "next/link";
import React, { memo, useMemo } from "react";
import { motion } from "framer-motion";
import Image from "next/image";

interface GenreCardProps {
  genre: string;
  color: string;
}

const GenreCard: React.FC<GenreCardProps> = memo(({ genre }) => {
  // ジャンルに基づいて背景グラデーションを設定 - メモ化
  const gradient = useMemo(() => {
    switch (genre) {
      case "Retro Wave":
        return "bg-gradient-to-br from-[#FF0080] via-[#7928CA] to-[#4A00E0]"; // レトロな紫とピンク
      case "Electro House":
        return "bg-gradient-to-r from-[#00F5A0] to-[#00D9F5]"; // エレクトロニックな青緑
      case "Nu Disco":
        return "bg-gradient-to-r from-[#FFD700] via-[#FF6B6B] to-[#FF1493]"; // ディスコ調の金とピンク
      case "City Pop":
        return "bg-gradient-to-br from-[#6366F1] via-[#A855F7] to-[#EC4899]"; // 都会的な紫とピンク
      case "Tropical House":
        return "bg-gradient-to-r from-[#00B4DB] to-[#0083B0]"; // トロピカルな青
      case "Vapor Wave":
        return "bg-gradient-to-br from-[#FF61D2] via-[#FE9090] to-[#FF9C7D]"; // ヴェイパーウェイブ調のピンクとオレンジ
      case "r&b":
        return "bg-gradient-to-r from-[#6A0DAD] via-[#9370DB] to-[#D4AF37]"; // R&B調の深い紫と金
      case "Chill House":
        return "bg-gradient-to-r from-[#43cea2] via-[#185a9d] to-[#6DD5FA]"; // リラックスした青緑と水色
      default:
        return "bg-gradient-to-r from-gray-700 via-gray-800 to-gray-900"; // デフォルトのダークグラデーション
    }
  }, [genre]);

  // ジャンルに基づいてアイコンを設定 - メモ化
  const icon = useMemo(() => {
    switch (genre) {
      case "Retro Wave":
        return "🌆";
      case "Electro House":
        return "⚡";
      case "Nu Disco":
        return "💿";
      case "City Pop":
        return "🏙️";
      case "Tropical House":
        return "🌴";
      case "Vapor Wave":
        return "📼";
      case "r&b":
        return "🎤";
      case "Chill House":
        return "🎧";
      default:
        return "🎵";
    }
  }, [genre]);

  // 背景画像のパスを取得する関数を追加 - メモ化
  const backgroundImage = useMemo(() => {
    switch (genre) {
      case "Retro Wave":
        return "/images/Retro.jpg";
      case "Electro House":
        return "/images/ElectroHouse.jpg";
      case "Nu Disco":
        return "/images/NuDisco.jpg";
      case "City Pop":
        return "/images/CityPop.jpg";
      case "Tropical House":
        return "/images/TropicalHouse.jpg";
      case "Vapor Wave":
        return "/images/VaporWave.jpg";
      case "r&b":
        return "/images/R&B.jpg";
      case "Chill House":
        return "/images/ChillHouse.jpg";
      default:
        return "/images/DefaultMusic.jpg";
    }
  }, [genre]);

  return (
    <Link href={`/genre/${genre}`}>
      <motion.div
        whileHover={{
          scale: 1.05,
          filter: "brightness(1.1)",
        }}
        whileTap={{ scale: 0.95 }}
        className="cursor-pointer"
      >
        <div
          className={`relative w-80 h-48 rounded-2xl overflow-hidden`}
          style={{
            boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.3)",
          }}
        >
          {/* 背景画像 - 透明度を上げる */}
          {backgroundImage && (
            <div className="absolute inset-0">
              <Image
                src={backgroundImage}
                alt={genre}
                fill
                className="object-cover opacity-90"
                sizes="320px"
              />
            </div>
          )}

          {/* グラデーションオーバーレイ - ジャンルに応じたグラデーションを適用 */}
          <div className={`absolute inset-0 ${gradient} opacity-30`} />

          {/* グラスモーフィズム効果 - 透明度を下げる */}
          <div className="absolute inset-0 backdrop-blur-[2px] bg-white/5">
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at 50% 0%, rgba(255,255,255,0.2), transparent 60%)",
              }}
            />
          </div>

          {/* 装飾的なパターン - 透明度を下げる */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.2) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />

          {/* コンテンツコンテナ */}
          <div className="relative h-full p-6 flex flex-col justify-between">
            {/* ジャンル名とアイコン - テキストに影を追加して視認性を向上 */}
            <div className="flex items-center space-x-3">
              <span className="text-3xl drop-shadow-lg">{icon}</span>
              <h2 className="text-white text-2xl font-bold tracking-wide drop-shadow-lg">
                {genre}
              </h2>
            </div>

            {/* 装飾的な要素 */}
            <div className="flex justify-between items-end">
              <div className="h-1 w-20 bg-white/20 rounded-full" />
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center"
              >
                <div className="w-8 h-8 rounded-full bg-white/20" />
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
});

// 表示名を設定
GenreCard.displayName = "GenreCard";

export default GenreCard;
