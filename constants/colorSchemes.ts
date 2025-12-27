// カラースキームのプリセット定義
export interface ColorScheme {
  id: string;
  name: string;
  description: string;
  colors: {
    // アクセントカラー（グラデーションの始まり）
    accentFrom: string;
    // アクセントカラー（グラデーションの中間）
    accentVia: string;
    // アクセントカラー（グラデーションの終わり）
    accentTo: string;
    // プライマリーカラー
    primary: string;
    // スクロールバーのカラー
    scrollbar: string;
    // アクティブタブのカラー
    activeTab: string;
    // ボタンホバーのグロウカラー
    glow: string;
    // Tailwind用テーマカラー（RGB値）
    theme300: string;
    theme400: string;
    theme500: string;
    theme600: string;
    theme900: string;
  };
  // UIプレビュー用のグラデーション
  previewGradient: string;
}

export const colorSchemes: ColorScheme[] = [
  {
    id: "violet",
    name: "バイオレット",
    description: "デフォルトの紫テーマ",
    colors: {
      accentFrom: "#7c3aed", // violet-600
      accentVia: "#3b82f6", // blue-500
      accentTo: "#ec4899", // pink-500
      primary: "#4c1d95", // violet-950
      scrollbar: "139, 92, 246", // violet-500 RGB
      activeTab: "#4c1d95",
      glow: "139, 92, 246",
      // Tailwind用RGB値 (purple系)
      theme300: "196, 181, 253", // purple-300
      theme400: "167, 139, 250", // purple-400
      theme500: "139, 92, 246", // purple-500
      theme600: "124, 58, 237", // purple-600
      theme900: "88, 28, 135", // purple-900
    },
    previewGradient: "linear-gradient(135deg, #7c3aed, #3b82f6, #ec4899)",
  },
  {
    id: "emerald",
    name: "エメラルド",
    description: "爽やかな緑テーマ",
    colors: {
      accentFrom: "#10b981", // emerald-500
      accentVia: "#06b6d4", // cyan-500
      accentTo: "#3b82f6", // blue-500
      primary: "#064e3b", // emerald-900
      scrollbar: "16, 185, 129", // emerald-500 RGB
      activeTab: "#064e3b",
      glow: "16, 185, 129",
      // Tailwind用RGB値 (emerald系)
      theme300: "110, 231, 183", // emerald-300
      theme400: "52, 211, 153", // emerald-400
      theme500: "16, 185, 129", // emerald-500
      theme600: "5, 150, 105", // emerald-600
      theme900: "6, 78, 59", // emerald-900
    },
    previewGradient: "linear-gradient(135deg, #10b981, #06b6d4, #3b82f6)",
  },
  {
    id: "rose",
    name: "ローズ",
    description: "エレガントなピンクテーマ",
    colors: {
      accentFrom: "#f43f5e", // rose-500
      accentVia: "#ec4899", // pink-500
      accentTo: "#a855f7", // purple-500
      primary: "#881337", // rose-900
      scrollbar: "244, 63, 94", // rose-500 RGB
      activeTab: "#881337",
      glow: "244, 63, 94",
      // Tailwind用RGB値 (rose系)
      theme300: "253, 164, 175", // rose-300
      theme400: "251, 113, 133", // rose-400
      theme500: "244, 63, 94", // rose-500
      theme600: "225, 29, 72", // rose-600
      theme900: "136, 19, 55", // rose-900
    },
    previewGradient: "linear-gradient(135deg, #f43f5e, #ec4899, #a855f7)",
  },
  {
    id: "amber",
    name: "アンバー",
    description: "温かみのあるオレンジテーマ",
    colors: {
      accentFrom: "#f59e0b", // amber-500
      accentVia: "#ef4444", // red-500
      accentTo: "#ec4899", // pink-500
      primary: "#78350f", // amber-900
      scrollbar: "245, 158, 11", // amber-500 RGB
      activeTab: "#78350f",
      glow: "245, 158, 11",
      // Tailwind用RGB値 (amber系)
      theme300: "252, 211, 77", // amber-300
      theme400: "251, 191, 36", // amber-400
      theme500: "245, 158, 11", // amber-500
      theme600: "217, 119, 6", // amber-600
      theme900: "120, 53, 15", // amber-900
    },
    previewGradient: "linear-gradient(135deg, #f59e0b, #ef4444, #ec4899)",
  },
  {
    id: "sky",
    name: "スカイ",
    description: "清潔感のある青テーマ",
    colors: {
      accentFrom: "#0ea5e9", // sky-500
      accentVia: "#6366f1", // indigo-500
      accentTo: "#8b5cf6", // violet-500
      primary: "#0c4a6e", // sky-900
      scrollbar: "14, 165, 233", // sky-500 RGB
      activeTab: "#0c4a6e",
      glow: "14, 165, 233",
      // Tailwind用RGB値 (sky系)
      theme300: "125, 211, 252", // sky-300
      theme400: "56, 189, 248", // sky-400
      theme500: "14, 165, 233", // sky-500
      theme600: "2, 132, 199", // sky-600
      theme900: "12, 74, 110", // sky-900
    },
    previewGradient: "linear-gradient(135deg, #0ea5e9, #6366f1, #8b5cf6)",
  },
  {
    id: "monochrome",
    name: "モノクローム",
    description: "シンプルなモノトーンテーマ",
    colors: {
      accentFrom: "#71717a", // zinc-500
      accentVia: "#a1a1aa", // zinc-400
      accentTo: "#d4d4d8", // zinc-300
      primary: "#27272a", // zinc-800
      scrollbar: "113, 113, 122", // zinc-500 RGB
      activeTab: "#27272a",
      glow: "113, 113, 122",
      // Tailwind用RGB値 (zinc系)
      theme300: "212, 212, 216", // zinc-300
      theme400: "161, 161, 170", // zinc-400
      theme500: "113, 113, 122", // zinc-500
      theme600: "82, 82, 91", // zinc-600
      theme900: "24, 24, 27", // zinc-900
    },
    previewGradient: "linear-gradient(135deg, #71717a, #a1a1aa, #d4d4d8)",
  },
];

export const getColorSchemeById = (id: string): ColorScheme => {
  return colorSchemes.find((scheme) => scheme.id === id) || colorSchemes[0];
};

export const DEFAULT_COLOR_SCHEME_ID = "violet";
