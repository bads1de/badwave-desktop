"use client";

import React, { useState, useEffect, useRef, memo } from "react";

interface ScrollingTextProps {
  text: string;
  duration?: number;
  limitCharacters?: number;
}

const ScrollingText: React.FC<ScrollingTextProps> = memo(
  ({ text, duration = 10, limitCharacters = 15 }) => {
    const [textWidth, setTextWidth] = useState(0);
    const textRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
      // テキストの幅を計算
      if (textRef.current) {
        setTextWidth(textRef.current.offsetWidth);
      }
    }, [text]);

    // アニメーションの速度を計算（テキストの長さに応じて調整）
    const animationDuration =
      textWidth > 0 ? Math.max(duration, textWidth / 100) : duration;

    if (text.length < limitCharacters) {
      return <span>{text}</span>;
    }

    return (
      <div className="scrolling-text-container">
        <span
          ref={textRef}
          className="scrolling-text"
          style={{ animationDuration: `${animationDuration}s` }}
        >
          {text}
        </span>
      </div>
    );
  }
);

// 表示名を設定
ScrollingText.displayName = "ScrollingText";

export default ScrollingText;
