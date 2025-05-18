import React, { useEffect, useRef, useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import useAudioWaveStore from "@/hooks/audio/useAudioWave";

/**
 * オーディオ波形コンポーネントのプロパティ型定義
 */
interface AudioWaveformProps {
  audioUrl: string; // 再生するオーディオファイルのURL
  isPlaying: boolean; // 再生中かどうかの状態
  onPlayPause: () => void; // 再生/一時停止ボタンが押されたときのコールバック
  onEnded: () => void; // 再生が終了したときのコールバック
  primaryColor: string; // 波形のメインカラー
  secondaryColor: string; // 波形のサブカラー
  imageUrl: string; // カバー画像のURL
  songId: string; // 曲のID
}

/**
 * オーディオ波形を表示するコンポーネント
 * オーディオの周波数データを取得し、キャンバスにリアルタイムな波形を描画します
 * 再生終了時にはカバー画像を表示します
 */
const AudioWaveform = ({
  primaryColor = "#00ff87", // デフォルトのメインカラー
  secondaryColor = "#60efff", // デフォルトのサブカラー
  imageUrl,
  audioUrl,
  songId,
  onPlayPause,
  onEnded,
  isPlaying: externalIsPlaying,
}: AudioWaveformProps) => {
  // キャンバスとアニメーションの参照
  const canvasRef = useRef<HTMLCanvasElement>(null); // 波形描画用キャンバスの参照
  const animationRef = useRef<number>(); // アニメーションフレームIDの参照

  // 状態管理
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 }); // マウス位置
  const [isTransitioning, setIsTransitioning] = useState(false); // トランジション中かどうか
  const [hasPlaybackStarted, setHasPlaybackStarted] = useState(false); // 再生が開始されたかどうか

  const {
    analyser,
    currentTime,
    duration,
    isPlaying,
    isEnded,
    play,
    pause,
    initializeAudio,
    cleanup,
    setIsEnded,
  } = useAudioWaveStore();

  /**
   * 外部の再生状態と内部の再生状態を同期させる
   */
  useEffect(() => {
    if (externalIsPlaying !== isPlaying) {
      if (externalIsPlaying) {
        play();
      } else {
        pause();
      }
    }
  }, [externalIsPlaying, isPlaying, play, pause]);

  /**
   * 再生状態が変化したときの処理
   * 再生が開始されたら再生開始フラグをセット
   */
  useEffect(() => {
    if (isPlaying) {
      console.log("Playback started, setting flags");
      setHasPlaybackStarted(true);
      setIsEnded(false); // 再生が開始されたら終了フラグをリセット
    }
  }, [isPlaying, setIsEnded]);

  /**
   * 再生終了状態が変化したときの処理
   * 再生が終了したら再生開始フラグをリセットし、コールバックを呼び出す
   */
  useEffect(() => {
    if (isEnded) {
      setHasPlaybackStarted(false);

      // 親コンポーネントに再生終了を通知
      onEnded && onEnded();
    }
  }, [isEnded, onEnded]);

  /**
   * コンポーネントのマウント時と依存値変更時の処理
   * オーディオを初期化し、アンマウント時にクリーンアップ
   */
  useEffect(() => {
    initializeAudio(audioUrl, songId);
    return () => {
      cleanup();
    };
  }, [songId, initializeAudio, audioUrl, cleanup]);

  /**
   * 再生状態が変化したときの描画処理
   * 再生中は波形を描画し、停止時はアニメーションをキャンセル
   */
  useEffect(() => {
    if (isPlaying) {
      setIsTransitioning(false);
      // 再生開始時に必ず波形を描画開始
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      draw();
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  /**
   * マウス移動時のハンドラー
   * キャンバス上のマウス位置を計算して状態を更新
   * これによりマウス位置に応じたインタラクティブな波形表示が可能に
   */
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  /**
   * アニメーション終了時のハンドラー
   * 再生終了時にオーディオをリセットし、次の再生の準備をする
   */
  const handleExitComplete = async () => {
    if (isEnded) {
      console.log("Animation exit complete, resetting audio");
      // オーディオをリセットして再初期化
      cleanup();
      await initializeAudio(audioUrl, songId);

      // 状態をリセット
      setIsEnded(false);
      setHasPlaybackStarted(false);

      // キャンバスのアニメーションをリセット
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = undefined;
      }
    }
  };

  /**
   * オーディオ波形を描画する関数
   * 周波数データを取得し、キャンバスに視覚的な波形を描画します
   */
  const draw = () => {
    // キャンバスとアナライザーが存在しない場合は処理を中止
    if (!canvasRef.current || !analyser) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 周波数データを取得
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    // キャンバスをクリア
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 背景グラデーションを設定
    const bgGradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    bgGradient.addColorStop(0, "rgba(0, 0, 0, 0.8)");
    bgGradient.addColorStop(1, "rgba(0, 0, 0, 0.6)");
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 波形の描画パラメータを設定
    const centerY = canvas.height / 2; // キャンバスの垂直中心
    const barWidth = (canvas.width / bufferLength) * 2; // 各バーの幅
    let x = 0; // 描画開始位置

    // 各周波数バンドに対して波形バーを描画
    for (let i = 0; i < bufferLength; i++) {
      // 周波数の強さに基づいてバーの高さを計算
      const barHeight = (dataArray[i] / 255) * (canvas.height / 2);

      // マウス位置に基づいてインタラクティブな効果を追加
      const distanceFromMouse = Math.abs(x - mousePosition.x);
      const heightMultiplier = Math.max(
        1,
        1.5 - distanceFromMouse / (canvas.width / 4)
      );
      const adjustedHeight = barHeight * heightMultiplier;

      // バーのグラデーションを作成
      const gradient = ctx.createLinearGradient(
        x,
        centerY - adjustedHeight,
        x,
        centerY + adjustedHeight
      );
      gradient.addColorStop(0, primaryColor);
      gradient.addColorStop(1, secondaryColor);

      // 上部のバーを描画（中心から上）
      ctx.beginPath();
      ctx.fillStyle = gradient;
      ctx.moveTo(x, centerY - adjustedHeight);
      ctx.lineTo(x + barWidth, centerY - adjustedHeight);
      ctx.lineTo(x + barWidth, centerY);
      ctx.lineTo(x, centerY);
      ctx.closePath();
      ctx.fill();

      // 下部のバーを描画（中心から下）
      ctx.beginPath();
      ctx.fillStyle = gradient;
      ctx.moveTo(x, centerY);
      ctx.lineTo(x + barWidth, centerY);
      ctx.lineTo(x + barWidth, centerY + adjustedHeight);
      ctx.lineTo(x, centerY + adjustedHeight);
      ctx.closePath();
      ctx.fill();

      // グロー効果を追加
      ctx.shadowBlur = 10;
      ctx.shadowColor = primaryColor;

      // 次のバーの位置に移動
      x += barWidth + 1;
    }

    // 再生進捗バーを描画
    const progress = currentTime / duration;
    ctx.beginPath();
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 2;
    ctx.moveTo(0, canvas.height - 5);
    ctx.lineTo(canvas.width * progress, canvas.height - 5);
    ctx.stroke();

    // アニメーションフレームを要求して連続的に描画
    animationRef.current = requestAnimationFrame(draw);
  };

  /**
   * コンポーネントのレンダリング
   * 再生状態に応じて波形またはカバー画像を表示
   */
  return (
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm overflow-hidden">
      {/* アニメーション付きのコンテンツ切り替え */}
      <AnimatePresence mode="wait" onExitComplete={handleExitComplete}>
        {/* 再生終了時はカバー画像を表示 */}
        {isEnded && !hasPlaybackStarted ? (
          <motion.div
            key="image"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5 }}
            className="relative h-full w-full"
          >
            <Image
              fill
              src={imageUrl}
              alt="Cover"
              className="object-cover opacity-40"
              sizes="100vw"
            />
          </motion.div>
        ) : (
          /* 再生中は波形を表示 */
          <motion.div
            key="waveform"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.5 }}
            className="relative h-full"
          >
            {/* 波形描画用キャンバス */}
            <canvas
              ref={canvasRef}
              width={1000}
              height={200}
              className={`w-full h-full cursor-pointer transition-all duration-500 ${
                isTransitioning ? "opacity-0" : "opacity-100"
              }`}
              onClick={() => {
                if (isPlaying) {
                  pause();
                } else {
                  setHasPlaybackStarted(true);
                  play();
                }
                // 親コンポーネントに再生/一時停止を通知
                onPlayPause && onPlayPause();
              }} // クリックで再生/一時停止切り替え
              onMouseMove={handleMouseMove} // マウス移動でインタラクティブな効果
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// メモ化されたコンポーネントをエクスポート
// パフォーマンスが重要なコンポーネントなのでメモ化する
export default memo(AudioWaveform, (prevProps, nextProps) => {
  // カスタム比較関数 - 必要な変更がある場合のみ再レンダリング
  return (
    prevProps.audioUrl === nextProps.audioUrl &&
    prevProps.isPlaying === nextProps.isPlaying &&
    prevProps.songId === nextProps.songId &&
    prevProps.primaryColor === nextProps.primaryColor &&
    prevProps.secondaryColor === nextProps.secondaryColor
  );
});
