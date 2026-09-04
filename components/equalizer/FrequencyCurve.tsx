"use client";

import React, { useMemo } from "react";
import { EqBand } from "@/hooks/stores/useEqualizerStore";

interface FrequencyCurveProps {
  bands: EqBand[];
  isEnabled: boolean;
  className?: string;
  /** カラースキームのアクセントカラー（From） */
  accentFrom?: string;
  /** カラースキームのアクセントカラー（To） */
  accentTo?: string;
}

/**
 * SVGによる周波数特性カーブ描画
 * 各バンドのゲイン値を滑らかなベジェ曲線で可視化
 */
const FrequencyCurve: React.FC<FrequencyCurveProps> = ({
  bands,
  isEnabled,
  className = "",
  accentFrom = "#7c3aed",
  accentTo = "#ec4899",
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

  // カラースキームに基づくテーマカラー
  const themeColor = isEnabled ? accentFrom : "#555";
  const themeColorLight = isEnabled ? accentTo : "#666";

  return (
    <div className="relative group overflow-hidden bg-[#0a0a0f] border border-theme-500/20 p-2 shadow-[inset_0_0_15px_rgba(var(--theme-500),0.05)]">
      {/* HUD装飾背景 */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" 
           style={{ 
             backgroundImage: `linear-gradient(rgba(var(--theme-500), 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--theme-500), 0.2) 1px, transparent 1px)`,
             backgroundSize: '10px 10px'
           }} 
      />
      
      {/* テクニカルラベル */}
      <div className="absolute top-1 left-2 text-[8px] font-mono text-theme-500/60 uppercase tracking-widest z-10">
        [ FREQ_ANALYZER_v2.4 ]
      </div>
      <div className="absolute bottom-1 right-2 text-[8px] font-mono text-theme-500/40 uppercase z-10">
        SIGNAL_PEAK: AUTO
      </div>

      <svg
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        className={`w-full h-20 relative z-0 ${className}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* 背景グリッド線 */}
        <line
          x1={padding}
          y1={centerY}
          x2={viewBoxWidth - padding}
          y2={centerY}
          stroke="rgba(var(--theme-500), 0.2)"
          strokeWidth="0.5"
          strokeDasharray="2,2"
        />
        
        {/* スキャンライン縦 */}
        {[0.25, 0.5, 0.75].map(pos => (
          <line
            key={pos}
            x1={padding + (viewBoxWidth - padding * 2) * pos}
            y1={0}
            x2={padding + (viewBoxWidth - padding * 2) * pos}
            y2={viewBoxHeight}
            stroke="rgba(var(--theme-500), 0.1)"
            strokeWidth="0.5"
          />
        ))}

        {/* グラデーション定義 */}
        <defs>
          <linearGradient id="curveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={themeColor} stopOpacity="0.4" />
            <stop offset="100%" stopColor={themeColor} stopOpacity="0" />
          </linearGradient>
          <filter id="neonGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 塗りつぶしエリア */}
        <path
          d={fillPath}
          fill="url(#curveGradient)"
          opacity={isEnabled ? 0.6 : 0.1}
        />

        {/* カーブ線 */}
        <path
          d={curvePath}
          fill="none"
          stroke={themeColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={isEnabled ? "url(#neonGlow)" : "none"}
          className="transition-all duration-300"
        />

        {/* ポイントマーカー (HUD Markers) */}
        {points.map((point, index) => (
          <g key={index} className="transition-all duration-300">
            <rect
              x={point.x - 1.5}
              y={point.y - 1.5}
              width="3"
              height="3"
              fill={isEnabled ? "#fff" : "#555"}
              className={isEnabled ? "animate-pulse" : ""}
            />
            {isEnabled && index % 3 === 0 && (
              <text x={point.x} y={point.y - 6} fontSize="6" fill={themeColor} textAnchor="middle" className="font-mono">
                {bands[index].gain > 0 ? "+" : ""}{bands[index].gain}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
};

export default FrequencyCurve;
