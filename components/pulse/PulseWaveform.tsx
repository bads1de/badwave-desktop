"use client";

import { useEffect, useRef } from "react";
import React from "react";

interface PulseWaveformProps {
  analyser: AnalyserNode | null;
}

const PulseWaveform = React.memo(({ analyser }: PulseWaveformProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!analyser || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    let animationId: number;

    const draw = () => {
      if (!ctx || !canvas) return;

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      analyser.getByteTimeDomainData(dataArray);

      ctx.lineWidth = 3;
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, "rgba(0, 255, 255, 0.1)");
      gradient.addColorStop(0.2, "rgba(0, 255, 255, 0.8)");
      gradient.addColorStop(0.5, "rgba(255, 0, 255, 1)");
      gradient.addColorStop(0.8, "rgba(0, 255, 255, 0.8)");
      gradient.addColorStop(1, "rgba(0, 255, 255, 0.1)");

      ctx.strokeStyle = gradient;

      ctx.shadowBlur = 10;
      ctx.shadowColor = "rgba(0, 255, 255, 0.8)";

      ctx.beginPath();

      const sliceWidth = (width * 1.0) / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [analyser]);

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = 200;
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-[200px]"
      style={{ display: "block" }}
    />
  );
});

PulseWaveform.displayName = "PulseWaveform";

export default PulseWaveform;
