"use client";

import React, { useMemo } from "react";
import { EqBand } from "@/hooks/stores/useEqualizerStore";

interface FrequencyCurveProps {
  bands: EqBand[];
  isEnabled: boolean;
  className?: string;
}

/**
 * SVGによる周波数特性カーブ描画
 * 各バンドのゲイン値を滑らかなベジェ曲線で可視化
 */
const FrequencyCurve: React.FC<FrequencyCurveProps> = ({
  bands,
  isEnabled,
  className = "",
}) => {
  const viewBoxWidth = 280;
  const viewBoxHeight = 80;
  const padding = 20;
  const centerY = viewBoxHeight / 2;
  const maxGain = 12;

  // ポイントの座標を計算
  const points = useMemo(() => {
    const effectiveWidth = viewBoxWidth - padding * 2;
    const spacing = effectiveWidth / (bands.length - 1);

    return bands.map((band, index) => ({
      x: padding + index * spacing,
      // ゲインを Y 座標に変換（上がプラス、下がマイナス）
      y: centerY - (band.gain / maxGain) * (centerY - 10),
    }));
  }, [bands, centerY]);

  // スムーズなベジェ曲線のパスを生成
  const curvePath = useMemo(() => {
    if (points.length < 2) return "";

    let path = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];

      // 制御点を計算（スムーズな曲線のため）
      const cpX1 = current.x + (next.x - current.x) / 3;
      const cpX2 = current.x + (2 * (next.x - current.x)) / 3;

      path += ` C ${cpX1} ${current.y}, ${cpX2} ${next.y}, ${next.x} ${next.y}`;
    }

    return path;
  }, [points]);

  // 塗りつぶしエリアのパス
  const fillPath = useMemo(() => {
    if (!curvePath) return "";
    return `${curvePath} L ${points[points.length - 1].x} ${centerY} L ${
      points[0].x
    } ${centerY} Z`;
  }, [curvePath, points, centerY]);

  return (
    <svg
      viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
      className={`w-full h-20 ${className}`}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* グリッド線 */}
      <line
        x1={padding}
        y1={centerY}
        x2={viewBoxWidth - padding}
        y2={centerY}
        stroke="#333"
        strokeWidth="1"
        strokeDasharray="4,4"
      />

      {/* グラデーション定義 */}
      <defs>
        <linearGradient id="curveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop
            offset="0%"
            stopColor={isEnabled ? "var(--theme-500)" : "#555"}
            stopOpacity="0.8"
          />
          <stop
            offset="100%"
            stopColor={isEnabled ? "var(--theme-500)" : "#555"}
            stopOpacity="0.1"
          />
        </linearGradient>
      </defs>

      {/* 塗りつぶしエリア */}
      <path
        d={fillPath}
        fill="url(#curveGradient)"
        opacity={isEnabled ? 0.3 : 0.1}
      />

      {/* カーブ線 */}
      <path
        d={curvePath}
        fill="none"
        stroke={isEnabled ? "var(--theme-500)" : "#555"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-all duration-200"
      />

      {/* ポイントマーカー */}
      {points.map((point, index) => (
        <circle
          key={index}
          cx={point.x}
          cy={point.y}
          r="3"
          fill={isEnabled ? "var(--theme-400)" : "#666"}
          className="transition-all duration-200"
        />
      ))}
    </svg>
  );
};

export default FrequencyCurve;
