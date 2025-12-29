"use client";

import React, { useRef, useEffect } from "react";
import Image from "next/image";
import { FaPlay, FaPause, FaStepBackward, FaStepForward } from "react-icons/fa";
import { MdSkipPrevious, MdSkipNext } from "react-icons/md";
import { Pulse } from "@/types";

interface CityPopThemeProps {
  pulses: Pulse[];
  currentPulse: Pulse | undefined;
  currentPulseIndex: number;
  isPlaying: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  analyser: AnalyserNode | null;
  hasStarted: boolean;
  audioRef: React.RefObject<HTMLAudioElement>;
  handleStart: () => void;
  togglePlay: () => void;
  handleVolumeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSeek: (seconds: number) => void;
  handleNextPulse: () => void;
  handlePrevPulse: () => void;
}

const CityPopTheme: React.FC<CityPopThemeProps> = ({
  pulses,
  currentPulse,
  currentPulseIndex,
  isPlaying,
  hasStarted,
  togglePlay,
  onSeek,
  handleNextPulse,
  handlePrevPulse,
  handleStart,
  analyser,
}) => {
  const trackTitle = currentPulse?.title || "Unknown Track";
  const trackGenre = currentPulse?.genre || "City Pop";

  const cdRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!analyser || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let animationId: number;

    const draw = () => {
      if (!ctx || !canvas) return;
      animationId = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      if (canvas.width === 0 || canvas.height === 0) return;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      const isDesktop = window.innerWidth >= 768;
      const cdRadius = isDesktop ? 225 : 150;
      const startRadius = cdRadius + 20;

      ctx.translate(centerX, centerY);

      ctx.beginPath();
      const barCount = 120;
      const angleStep = (Math.PI * 2) / barCount;

      for (let i = 0; i < barCount; i++) {
        const value = dataArray[i + 4] || 0;
        const barHeight = Math.max(0, (value / 255) * 60);

        const angle = i * angleStep;

        ctx.moveTo(
          Math.cos(angle) * startRadius,
          Math.sin(angle) * startRadius
        );
        ctx.lineTo(
          Math.cos(angle) * (startRadius + barHeight),
          Math.sin(angle) * (startRadius + barHeight)
        );
      }

      ctx.lineCap = "round";
      ctx.lineWidth = 4;

      const gradient = ctx.createRadialGradient(
        0,
        0,
        startRadius,
        0,
        0,
        startRadius + 60
      );
      gradient.addColorStop(0, "rgba(255, 105, 180, 0.8)");
      gradient.addColorStop(0.5, "rgba(0, 255, 255, 0.8)");
      gradient.addColorStop(1, "rgba(255, 255, 0, 0)");

      ctx.strokeStyle = gradient;
      ctx.shadowBlur = 15;
      ctx.shadowColor = "rgba(255, 105, 180, 0.5)";
      ctx.stroke();

      const avgVol = dataArray.slice(0, 20).reduce((a, b) => a + b) / 20;
      if (avgVol > 100) {
        ctx.beginPath();
        ctx.arc(0, 0, startRadius + 2, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 255, 255, ${(avgVol - 100) / 400})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    };
    draw();

    return () => cancelAnimationFrame(animationId);
  }, [analyser]);

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const size = Math.max(window.innerWidth, window.innerHeight);
        canvasRef.current.width = size;
        canvasRef.current.height = size;
        canvasRef.current.style.width = `${size}px`;
        canvasRef.current.style.height = `${size}px`;
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="relative w-full h-full bg-[#FFFBEB] overflow-hidden flex flex-col font-sans text-gray-800">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 z-0">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                opacity: Math.random() * 0.5 + 0.2,
              }}
            />
          ))}
        </div>
        <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-t from-pink-400 via-orange-300 to-transparent rounded-full opacity-40 blur-3xl animate-pulse" />

        <div
          className="absolute bottom-0 left-0 w-full h-[40%] opacity-20"
          style={{
            perspective: "500px",
            background:
              "linear-gradient(transparent, rgba(255, 105, 180, 0.2))",
          }}
        >
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `
                linear-gradient(to right, #ff69b4 1px, transparent 1px),
                linear-gradient(to bottom, #ff69b4 1px, transparent 1px)
              `,
              backgroundSize: "40px 40px",
              transform: "rotateX(60deg) translateY(-20%)",
              transformOrigin: "top",
            }}
          />
        </div>

        <div className="absolute bottom-[25%] left-0 w-full h-[15%] flex items-end justify-between px-4 opacity-30 select-none pointer-events-none">
          <div className="w-[15%] h-[100%] bg-blue-900 clip-path-building-1" />
          <div className="w-[10%] h-[120%] bg-indigo-900 clip-path-building-2" />
          <div className="w-[20%] h-[150%] bg-blue-950 clip-path-building-3" />
          <div className="w-[12%] h-[110%] bg-indigo-950 clip-path-building-1" />
          <div className="w-[15%] h-[130%] bg-blue-900 clip-path-building-2" />
        </div>

        <div className="absolute bottom-0 left-[-50px] w-64 h-96 opacity-40 animate-wiggle select-none pointer-events-none">
          <svg
            viewBox="0 0 100 150"
            fill="currentColor"
            className="text-gray-900"
          >
            <path d="M50,150 Q45,100 50,50 Q40,40 20,45 Q40,35 50,45 Q60,35 80,45 Q60,40 50,50" />
            <path d="M50,50 Q45,30 30,35 Q45,25 50,35 Q55,25 70,35 Q55,30 50,50" />
          </svg>
        </div>
        <div className="absolute bottom-0 right-[-50px] w-64 h-96 opacity-40 animate-wiggle-reverse select-none pointer-events-none transform scale-x-[-1]">
          <svg
            viewBox="0 0 100 150"
            fill="currentColor"
            className="text-gray-900"
          >
            <path d="M50,150 Q45,100 50,50 Q40,40 20,45 Q40,35 50,45 Q60,35 80,45 Q60,40 50,50" />
            <path d="M50,50 Q45,30 30,35 Q45,25 50,35 Q55,25 70,35 Q55,30 50,50" />
          </svg>
        </div>

        <div className="absolute inset-0 bg-gradient-to-br from-yellow-200 via-pink-100 to-cyan-200 opacity-90" />

        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle, #ff69b4 2px, transparent 2.5px)",
            backgroundSize: "30px 30px",
          }}
        />

        <div
          className="absolute inset-0 pointer-events-none z-40 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))",
            backgroundSize: "100% 4px, 3px 100%",
          }}
        />

        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-[0.03] select-none pointer-events-none">
          <div className="absolute top-[10%] -left-[10%] text-[20vw] font-black leading-none text-blue-500 whitespace-nowrap animate-slide-slow">
            CITY POP SUMMER WAVE
          </div>
          <div className="absolute bottom-[10%] -right-[10%] text-[20vw] font-black leading-none text-pink-500 whitespace-nowrap animate-slide-delayed">
            PLASTIC LOVE 1984
          </div>
        </div>

        <div className="absolute top-20 left-10 w-40 h-40 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float-slow" />
        <div className="absolute top-1/2 right-20 w-60 h-60 bg-pink-300 rounded-full mix-blend-multiply filter blur-2xl opacity-60 animate-float-delayed" />
        <div className="absolute bottom-20 left-1/3 w-40 h-40 bg-cyan-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float-slow" />

        <div className="absolute top-[15%] right-[10%] rotate-12 drop-shadow-lg">
          <svg
            width="120"
            height="120"
            viewBox="0 0 100 100"
            fill="none"
            className="text-cyan-400 opacity-80 animate-wiggle"
          >
            <path
              d="M10 50 Q 25 25, 50 50 T 90 50"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div className="absolute bottom-[25%] left-[8%] -rotate-12 drop-shadow-lg">
          <svg
            width="100"
            height="100"
            viewBox="0 0 100 100"
            fill="none"
            className="text-pink-400 opacity-80 animate-wiggle-reverse"
          >
            <polygon
              points="50,10 90,90 10,90"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div
          className="absolute inset-0 pointer-events-none z-50 opacity-[0.015] contrast-150 grayscale"
          style={{
            backgroundImage:
              "url('https://grainy-gradients.vercel.app/noise.svg')",
          }}
        />

        <div className="absolute top-[20%] left-[15%] w-12 h-12 border-4 border-yellow-400 rounded-full opacity-40 animate-spin-slow" />
        <div className="absolute bottom-[20%] right-[15%] w-16 h-4 border-t-4 border-b-4 border-cyan-400 opacity-40 -rotate-45 animate-bounce-custom" />
        <div className="absolute top-[60%] left-[5%] text-pink-500 opacity-30 text-6xl font-black italic select-none">
          1984
        </div>
      </div>

      {!hasStarted && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm cursor-pointer"
          onClick={handleStart}
        >
          <div className="bg-white px-8 py-4 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform hover:-translate-y-1 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all">
            <h1 className="text-4xl font-black tracking-widest text-black">
              START LISTENING
            </h1>
          </div>
        </div>
      )}

      <div
        className={`relative z-10 flex flex-col md:flex-row h-full items-center justify-center w-full max-w-7xl mx-auto p-8 pb-24 transition-opacity duration-1000 ${
          hasStarted ? "opacity-100" : "opacity-50 blur-sm"
        }`}
      >
        <div className="hidden md:flex flex-col h-[80%] w-24 bg-gray-900 text-white shadow-[10px_10px_30px_rgba(0,0,0,0.2)] mr-16 relative overflow-hidden flex-shrink-0 z-20">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500" />
          <div className="flex-1 flex flex-col items-center py-8 writing-vertical-rl text-orientation-mixed">
            <span className="text-xs font-mono tracking-widest mb-4 opacity-70">
              STEREO SOUND
            </span>
            <h2 className="text-3xl font-black tracking-widest whitespace-nowrap text-yellow-300 drop-shadow-md">
              {trackTitle}
            </h2>
            <span className="mt-8 text-lg font-bold tracking-wider">
              {trackGenre}
            </span>
          </div>
          <div className="p-4 text-center border-t border-gray-700">
            <span className="text-2xl font-black">¥2,800</span>
          </div>
          <div className="absolute -right-4 top-1/4 transform rotate-90 origin-right">
            <div className="px-4 py-1 bg-black text-pink-500 border-2 border-pink-500 rounded text-xs font-bold animate-pulse shadow-[0_0_10px_#ff69b4]">
              ON AIR
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center flex-1 w-full max-w-[600px] relative">
          <div className="relative group perspective-1000 z-10">
            <canvas
              ref={canvasRef}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0"
            />

            <div className="absolute inset-0 bg-white/40 rounded-full scale-110 transform blur-md" />

            <div
              ref={cdRef}
              className={`relative w-[280px] h-[280px] md:w-[420px] md:h-[420px] rounded-full shadow-2xl border-[6px] border-white overflow-hidden bg-gray-100 transition-transform duration-[2s] ease-linear`}
              style={{
                animation: isPlaying ? "spin 8s linear infinite" : "none",
                boxShadow: isPlaying
                  ? "0 0 50px rgba(255,105,180,0.4)"
                  : "0 10px 30px rgba(0,0,0,0.2)",
              }}
            >
              <div className="absolute inset-0">
                <Image
                  src="/images/city_pop_cd.png"
                  alt="City Pop CD"
                  fill
                  className="object-cover"
                  priority
                />
              </div>

              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-white/95 rounded-full border-4 border-gray-200 flex items-center justify-center shadow-inner">
                <div className="w-5 h-5 bg-transparent rounded-full border-2 border-gray-400/50" />
              </div>

              <div className="absolute inset-0 bg-gradient-to-tr from-white/30 via-transparent to-black/10 pointer-events-none rounded-full" />
            </div>

            {isPlaying && (
              <>
                <div className="absolute -top-10 -right-5 text-4xl animate-bounce-custom delay-100 text-pink-500">
                  🎵
                </div>
                <div className="absolute top-20 -right-16 text-3xl animate-bounce-custom delay-300 text-cyan-500">
                  ✨
                </div>
                <div className="absolute -bottom-5 -left-10 text-4xl animate-bounce-custom delay-700 text-yellow-500">
                  ♪
                </div>
              </>
            )}
          </div>

          <div className="mt-8 text-center md:hidden z-20">
            <h2 className="text-2xl font-black text-gray-800 tracking-wider mix-blend-multiply">
              {trackTitle}
            </h2>
            <p className="text-pink-500 font-bold">{trackGenre}</p>
          </div>

          <div className="mt-16 flex items-center gap-6 md:gap-8 bg-white/90 backdrop-blur px-10 py-5 rounded-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-2 border-black z-20 relative">
            <button
              onClick={handlePrevPulse}
              className="text-gray-900 hover:text-pink-500 transition-transform active:scale-95"
            >
              <MdSkipPrevious size={32} />
            </button>

            <button
              onClick={() => onSeek(-10)}
              className="text-gray-900 hover:text-cyan-500 transition-transform active:scale-95"
            >
              <FaStepBackward size={20} />
            </button>

            <button
              onClick={togglePlay}
              className="w-16 h-16 bg-gradient-to-br from-yellow-300 to-yellow-500 hover:from-yellow-200 hover:to-yellow-400 rounded-full border-2 border-black flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transform hover:-translate-y-1 active:translate-y-0 active:shadow-none transition-all"
            >
              {isPlaying ? (
                <FaPause size={24} className="text-black" />
              ) : (
                <FaPlay size={24} className="text-black ml-1" />
              )}
            </button>

            <button
              onClick={() => onSeek(10)}
              className="text-gray-900 hover:text-cyan-500 transition-transform active:scale-95"
            >
              <FaStepForward size={20} />
            </button>

            <button
              onClick={handleNextPulse}
              className="text-gray-900 hover:text-pink-500 transition-transform active:scale-95"
            >
              <MdSkipNext size={32} />
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .writing-vertical-rl {
          writing-mode: vertical-rl;
          text-orientation: mixed;
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-float-slow {
          animation: float 8s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float 10s ease-in-out infinite reverse;
        }
        .animate-wiggle {
          animation: wiggle 3s ease-in-out infinite;
        }
        .animate-wiggle-reverse {
          animation: wiggle 4s ease-in-out infinite reverse;
        }
        .animate-spin-slow {
          animation: spin 20s linear infinite;
        }
        .animate-bounce-custom {
          animation: bounceCustom 2s infinite;
        }
        .animate-slide-slow {
          animation: slideLeft 30s linear infinite;
        }
        .animate-slide-delayed {
          animation: slideRight 35s linear infinite;
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        @keyframes wiggle {
          0%,
          100% {
            transform: rotate(12deg);
          }
          50% {
            transform: rotate(-12deg);
          }
        }
        @keyframes bounceCustom {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-15px);
          }
        }
        @keyframes slideLeft {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
        @keyframes slideRight {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(50%);
          }
        }

        .clip-path-building-1 {
          clip-path: polygon(
            0% 100%,
            0% 20%,
            30% 20%,
            30% 0%,
            70% 0%,
            70% 20%,
            100% 20%,
            100% 100%
          );
        }
        .clip-path-building-2 {
          clip-path: polygon(
            0% 100%,
            10% 100%,
            10% 40%,
            30% 40%,
            30% 10%,
            70% 10%,
            70% 40%,
            90% 40%,
            90% 100%,
            100% 100%
          );
        }
        .clip-path-building-3 {
          clip-path: polygon(
            0% 100%,
            0% 30%,
            20% 30%,
            20% 10%,
            40% 10%,
            40% 0%,
            60% 0%,
            60% 10%,
            80% 10%,
            80% 30%,
            100% 30%,
            100% 100%
          );
        }
      `}</style>
    </div>
  );
};

export default CityPopTheme;
