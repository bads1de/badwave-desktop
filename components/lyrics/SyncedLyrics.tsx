"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { AudioEngine } from "@/libs/audio/AudioEngine";

interface SyncedLyricsProps {
  lyrics: string;
}

interface LyricLine {
  time: number;
  text: string;
}

// [00:00.00] 形式を秒に変換
const parseTime = (timeStr: string): number => {
  const parts = timeStr.split(":");
  const min = parseFloat(parts[0]);
  const sec = parseFloat(parts[1]);
  return min * 60 + sec;
};

// 秒を [mm:ss] 形式に変換（表示用）
const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

// ライン番号をHUD形式に
const formatLineNum = (n: number, total: number): string => {
  const digits = String(total).length;
  return String(n + 1).padStart(digits, "0");
};

const SyncedLyrics = ({ lyrics }: SyncedLyricsProps) => {
  const [currentTime, setCurrentTime] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const engine = AudioEngine.getInstance();
  const isUserScrolling = useRef(false);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  // 1. LRCパース
  const lines = useMemo(() => {
    if (!lyrics) return [];

    // LRC形式かどうかを簡易チェック
    if (!lyrics.includes("[")) return [];

    const result: LyricLine[] = [];
    const rawLines = lyrics.split("\n");

    for (const line of rawLines) {
      // [00:00.00]Text
      const match = line.match(/^\[(\d{2}:\d{2}\.\d{2,3})\](.*)/);
      if (match) {
        const text = match[2].trim();
        // メタデータ行（[ti:...], [ar:...] など）はスキップ
        if (text && !text.startsWith("[")) {
          result.push({
            time: parseTime(match[1]),
            text,
          });
        }
      }
    }

    return result;
  }, [lyrics]);

  // 2. 時刻同期
  useEffect(() => {
    const audio = engine.audio;
    if (!audio) return;

    // 初期化時に現在時刻を設定
    setCurrentTime(audio.currentTime);

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    return () => audio.removeEventListener("timeupdate", handleTimeUpdate);
  }, [engine]);

  // 3. アクティブ行の探索
  const activeIndex = useMemo(() => {
    let index = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].time <= currentTime) {
        index = i;
      } else {
        break;
      }
    }
    return index;
  }, [currentTime, lines]);

  // ユーザーのスクロール操作を検知
  const handleScroll = () => {
    isUserScrolling.current = true;
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);

    scrollTimeout.current = setTimeout(() => {
      isUserScrolling.current = false;
    }, 2000);
  };

  // 4. 自動スクロール
  useEffect(() => {
    if (
      activeIndex !== -1 &&
      containerRef.current &&
      !isUserScrolling.current
    ) {
      const activeEl = containerRef.current.children[
        activeIndex
      ] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  }, [activeIndex]);

  // 5. 行クリックでシーク
  const handleLineClick = (time: number) => {
    if (engine.audio) {
      engine.audio.currentTime = time;
    }
  };

  // プログレス計算
  const progressPercent = lines.length > 0
    ? Math.round(((activeIndex + 1) / lines.length) * 100)
    : 0;

  // LRCでない、またはパース失敗時はプレーンテキスト表示
  if (lines.length === 0) {
    return (
      <div className="relative w-full h-full">
        <div className="flex items-center justify-center h-full py-8 px-6">
          <div className="w-full max-h-full overflow-y-auto custom-scrollbar pr-2">
            <p className="whitespace-pre-wrap text-theme-500/60 text-sm font-mono leading-relaxed tracking-widest uppercase text-left">
              {lyrics || "歌詞はありません"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* ── HUD ヘッダー ── */}
      <div className="shrink-0 px-4 pt-3 pb-2 border-b border-theme-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[8px] text-theme-500 tracking-[0.5em] uppercase animate-pulse">
            <span className="w-1.5 h-1.5 bg-theme-500 rounded-full shadow-[0_0_6px_rgba(var(--theme-500),0.8)]" />
            [ LYRICS_SYNC_STREAM ]
          </div>
          <div className="flex items-center gap-3 text-[9px] font-mono text-theme-500/40 tracking-wider">
            <span>LN {formatLineNum(activeIndex >= 0 ? activeIndex : 0, lines.length)}/{String(lines.length).padStart(2, "0")}</span>
            <span className="text-theme-500/20">|</span>
            <span>{formatTime(currentTime)}</span>
          </div>
        </div>
      </div>

      {/* ── スキャンラインテクスチャ（静的） ── */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.015] bg-[length:100%_4px] bg-[linear-gradient(rgba(255,255,255,0)_50%,rgba(0,0,0,0.5)_50%)] z-10" />

      {/* ── 上下グラデーションフェード ── */}
      <div className="absolute top-[37px] left-0 right-0 h-12 bg-gradient-to-b from-[#0a0a0f] to-transparent pointer-events-none z-20" />
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#0a0a0f] to-transparent pointer-events-none z-20" />

      {/* ── 歌詞リスト ── */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto custom-scrollbar scroll-smooth font-mono relative z-10"
        style={{ paddingBlock: "40%" }}
      >
        {lines.map((line, index) => {
          const isActive = index === activeIndex;
          const isPast = index < activeIndex;
          const text = line.text === "" ? "\u00A0" : line.text;

          return (
            <div
              key={index}
              onClick={() => handleLineClick(line.time)}
              className={`
                group relative w-full px-4 py-2.5 cursor-pointer
                transition-all duration-500 ease-out
                flex items-start gap-3
                ${isActive
                  ? "bg-theme-500/[0.04]"
                  : "hover:bg-theme-500/[0.02]"
                }
              `}
            >
              {/* 左ガイドライン */}
              <div
                className={`
                  shrink-0 w-px self-stretch transition-all duration-500 ease-out
                  ${isActive
                    ? "bg-theme-500/70 shadow-[0_0_8px_rgba(var(--theme-500),0.5)]"
                    : isPast
                      ? "bg-theme-500/10 group-hover:bg-theme-500/20"
                      : "bg-transparent group-hover:bg-theme-500/10"
                  }
                `}
              />

              {/* ライン番号 */}
              <div
                className={`
                  shrink-0 w-7 text-right text-[9px] font-mono
                  transition-all duration-500 ease-out
                  ${isActive
                    ? "text-theme-500/70"
                    : "text-theme-500/15 group-hover:text-theme-500/30"
                  }
                `}
              >
                {formatLineNum(index, lines.length)}
              </div>

              {/* 歌詞テキスト */}
              <div className="flex-1 min-w-0">
                <div className={isActive ? "animate-activeLineEnter" : ""}>
                  <p
                    className={`
                      transition-all duration-500 ease-out
                      ${isActive
                        ? "text-base md:text-lg font-bold tracking-wider uppercase drop-shadow-[0_0_12px_rgba(var(--theme-500),0.7)]"
                        : "text-sm tracking-widest uppercase"
                      }
                      ${isActive
                        ? "text-white"
                        : isPast
                          ? "text-theme-500/25 group-hover:text-theme-500/40"
                          : "text-theme-500/10 group-hover:text-theme-500/35"
                      }
                    `}
                    style={
                      isActive
                        ? { animation: "textGlowPulse 2s ease-in-out infinite" }
                        : undefined
                    }
                  >
                    {isActive && (
                      <span
                        className="inline-block mr-2 text-theme-500"
                        style={{ textShadow: "0 0 10px rgba(var(--theme-500),0.9)" }}
                      >
                        {">"}
                      </span>
                    )}
                    {isPast && !isActive && (
                      <span className="text-theme-500/15 mr-2 select-none">
                        //
                      </span>
                    )}
                    {text}
                  </p>
                </div>

                {/* アクティブライン装飾：グローライン */}
                {isActive && (
                  <div
                    className="mt-1 h-px animate-lineGlowExpand"
                    style={{
                      background: "linear-gradient(90deg, rgba(var(--theme-500),0.6) 0%, rgba(var(--theme-500),0.2) 50%, transparent 100%)",
                      boxShadow: "0 0 6px rgba(var(--theme-500),0.3)",
                    }}
                  />
                )}
              </div>

              {/* ホバー時のタイムスタンプ */}
              <div
                className={`
                  shrink-0 text-[8px] font-mono tracking-widest
                  transition-all duration-300
                  ${isActive
                    ? "text-theme-500/50"
                    : "text-theme-500/0 group-hover:text-theme-500/30"
                  }
                `}
              >
                [{formatTime(line.time)}]
              </div>
            </div>
          );
        })}
      </div>

      {/* ── フッター：プログレスバー ── */}
      <div className="shrink-0 px-4 py-2 border-t border-theme-500/10">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-theme-500/10 relative overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 transition-all duration-500 ease-out"
              style={{
                width: `${progressPercent}%`,
                background: "linear-gradient(90deg, rgba(var(--theme-500),0.6) 0%, rgba(var(--theme-500),0.2) 100%)",
                boxShadow: "0 0 6px rgba(var(--theme-500),0.3)",
              }}
            />
          </div>
          <span className="text-[8px] font-mono text-theme-500/30 uppercase tracking-[0.3em] animate-progressPulse">
            {progressPercent}%
          </span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[8px] font-mono text-theme-500/15 uppercase tracking-[0.3em]">
            --- END_OF_STREAM ---
          </span>
          <span className="text-[7px] font-mono text-theme-500/10 tracking-widest">
            {lines.length} NODES
          </span>
        </div>
      </div>
    </div>
  );
};

export default SyncedLyrics;
