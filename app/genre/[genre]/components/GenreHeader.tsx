"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";

interface GenreHeaderProps {
  genre: string;
}

const GenreHeader: React.FC<GenreHeaderProps> = ({ genre }) => {
  const getGradient = () => {
    // 大文字小文字を区別せずに比較するために小文字に変換
    const genreLower = genre.toLowerCase();

    switch (genreLower) {
      case "retro wave":
        return "bg-gradient-to-br from-[#FF0080] via-[#7928CA] to-[#4A00E0]";
      case "electro house":
        return "bg-gradient-to-r from-[#00F5A0] to-[#00D9F5]";
      case "nu disco":
        return "bg-gradient-to-r from-[#FFD700] via-[#FF6B6B] to-[#FF1493]";
      case "city pop":
        return "bg-gradient-to-br from-[#6366F1] via-[#A855F7] to-[#EC4899]";
      case "tropical house":
        return "bg-gradient-to-r from-[#00B4DB] to-[#0083B0]";
      case "vapor wave":
        return "bg-gradient-to-br from-[#FF61D2] via-[#FE9090] to-[#FF9C7D]";
      case "r&b":
        return "bg-gradient-to-r from-[#6A0DAD] via-[#9370DB] to-[#D4AF37]";
      case "chill house":
        return "bg-gradient-to-r from-[#43cea2] via-[#185a9d] to-[#6DD5FA]";
      default:
        return "bg-gradient-to-r from-gray-700 via-gray-800 to-gray-900";
    }
  };

  const getIcon = () => {
    // 大文字小文字を区別せずに比較するために小文字に変換
    const genreLower = genre.toLowerCase();

    switch (genreLower) {
      case "retro wave":
        return "🌆";
      case "electro house":
        return "⚡";
      case "nu disco":
        return "💿";
      case "city pop":
        return "🏙️";
      case "tropical house":
        return "🌴";
      case "vapor wave":
        return "📼";
      case "r&b":
        return "🎤";
      case "chill house":
        return "🎧";
      default:
        return "🎵";
    }
  };

  const getBackgroundImage = () => {
    // 大文字小文字を区別せずに比較するために小文字に変換
    const genreLower = genre.toLowerCase();

    switch (genreLower) {
      case "retro wave":
        return "/images/Retro.jpg";
      case "electro house":
        return "/images/ElectroHouse.jpg";
      case "nu disco":
        return "/images/NuDisco.jpg";
      case "city pop":
        return "/images/CityPop.jpg";
      case "tropical house":
        return "/images/TropicalHouse.jpg";
      case "vapor wave":
        return "/images/VaporWave.jpg";
      case "r&b":
        return "/images/R&B.jpg";
      case "chill house":
        return "/images/ChillHouse.jpg";
      default:
        return "/images/DefaultMusic.jpg";
    }
  };

  return (
    <div className="relative w-full h-[200px] overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src={getBackgroundImage()}
          alt={genre}
          fill
          className="object-cover opacity-80"
          sizes="100vw"
        />
      </div>
      {/* グラデーションオーバーレイ */}
      <div className={`absolute inset-0 ${getGradient()} opacity-40`} />
      {/* グラスモーフィズム効果 */}
      <div className="absolute inset-0 backdrop-blur-sm bg-black/20">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 50% 0%, rgba(255,255,255,0.2), transparent 70%)",
          }}
        />
      </div>
      {/* コンテンツ - サイズと余白を調整 */}
      <div className="relative h-full max-w-7xl mx-auto px-6 py-6 flex items-end">
        <div className="mb-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-x-3"
          >
            <span className="text-4xl drop-shadow-lg">{getIcon()}</span>

            <div>
              <h1 className="text-3xl font-bold text-white tracking-wide drop-shadow-lg mb-2">
                {genre}
              </h1>
              <div className="h-0.5 w-24 bg-white/30 rounded-full" />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default GenreHeader;
