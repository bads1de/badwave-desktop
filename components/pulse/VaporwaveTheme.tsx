"use client";

import RetroPlayer from "./RetroPlayer";
import Visualizer from "./Visualizer";
import WireframeBackground from "./WireframeBackground";
import PulseWaveform from "./PulseWaveform";
import { Pulse } from "@/types";

interface VaporwaveThemeProps {
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

export default function VaporwaveTheme({
  pulses,
  currentPulse,
  currentPulseIndex,
  isPlaying,
  volume,
  currentTime,
  duration,
  analyser,
  hasStarted,
  audioRef,
  handleStart,
  togglePlay,
  handleVolumeChange,
  onSeek,
  handleNextPulse,
  handlePrevPulse,
}: VaporwaveThemeProps) {
  return (
    <div className="relative bg-[#090014] h-full w-full overflow-hidden flex flex-col font-sans">
      <div className="pointer-events-none absolute inset-0 z-50 overflow-hidden h-full w-full">
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-transparent to-blue-500/10 mix-blend-overlay" />
        <div
          className="absolute inset-0 z-10 opacity-30"
          style={{
            background:
              "linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0) 50%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.2))",
            backgroundSize: "100% 4px",
          }}
        />
        <div
          className="absolute inset-0 z-20 opacity-[0.03] mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")`,
          }}
        />
        <div
          className="absolute inset-0 z-30"
          style={{
            background:
              "radial-gradient(circle at center, transparent 60%, rgba(0,0,0,0.6) 100%)",
            boxShadow: "inset 0 0 100px rgba(0,0,0,0.9)",
          }}
        />
      </div>

      <div
        className={`absolute inset-0 pointer-events-none z-0 transition-opacity duration-1000 ${
          hasStarted ? "opacity-100" : "opacity-30 blur-sm"
        }`}
      >
        <WireframeBackground analyser={analyser} />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
            backgroundSize: "50px 50px",
            opacity: 0.3,
          }}
        />
        <div className="absolute top-0 w-full h-[50%] bg-gradient-to-b from-pink-900/30 to-transparent perspective-grid-ceiling" />
        <div className="absolute bottom-0 w-full h-[50%] bg-gradient-to-t from-pink-900/30 to-transparent perspective-grid-floor" />
        <div className="absolute top-[50%] left-0 w-full -translate-y-[50%] z-20 mix-blend-screen">
          <PulseWaveform analyser={analyser} />
        </div>
      </div>

      <div
        className={`absolute inset-0 pointer-events-none z-10 overflow-hidden transition-opacity duration-700 ${
          hasStarted ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="absolute top-6 left-6 md:top-10 md:left-10">
          <h1
            className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-white drop-shadow-[0_0_10px_rgba(0,255,255,0.8)] italic tracking-tighter"
            style={{ fontFamily: "'Arial Black', sans-serif" }}
          >
            PULSE
          </h1>
          {currentPulse && (
            <div className="mt-2">
              <p className="text-cyan-300 text-lg font-mono">
                {currentPulse.title}
              </p>
              <p className="text-pink-400 text-sm font-mono">
                {currentPulse.genre}
              </p>
            </div>
          )}
        </div>

        <div className="absolute top-6 right-6 md:top-10 md:right-10 hidden md:block">
          <Visualizer />
        </div>

        <div className="absolute left-4 top-1/2 -translate-y-1/2 hidden md:flex flex-col gap-4">
          <div
            className="text-6xl font-bold text-white/10 writing-vertical-rl font-serif tracking-[0.5em] select-none"
            style={{ textShadow: "0 0 10px rgba(255,0,255,0.5)" }}
          >
            ラジオ
          </div>
          <div className="w-[2px] h-32 bg-gradient-to-b from-transparent via-cyan-500 to-transparent opacity-50 mx-auto" />
        </div>

        <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden md:flex flex-col gap-4">
          <div className="w-[2px] h-32 bg-gradient-to-b from-transparent via-pink-500 to-transparent opacity-50 mx-auto" />
          <div
            className="text-6xl font-bold text-white/10 writing-vertical-rl font-serif tracking-[0.5em] select-none"
            style={{ textShadow: "0 0 10px rgba(0,255,255,0.5)" }}
          >
            音楽放
          </div>
        </div>

        <div className="absolute top-[20%] left-[20%] text-cyan-500/20 font-mono text-sm">
          SYSTEM_READY
        </div>
        <div className="absolute bottom-[20%] right-[20%] text-pink-500/20 font-mono text-sm">
          AESTHETIC_MODE
        </div>

        {pulses.length > 0 && (
          <div className="absolute bottom-[10%] left-1/2 -translate-x-1/2 text-cyan-300/50 font-mono text-sm">
            TRACK {currentPulseIndex + 1} / {pulses.length}
          </div>
        )}
      </div>

      <div
        className={`flex-1 flex flex-col items-center justify-center relative z-20 px-4 pb-10 w-full h-full transition-all duration-700 ${
          hasStarted
            ? "opacity-100 scale-100"
            : "opacity-0 scale-95 pointer-events-none"
        }`}
      >
        <div className="w-full max-w-6xl flex justify-center items-center h-full pt-10">
          <RetroPlayer
            audioRef={audioRef}
            isPlaying={isPlaying}
            togglePlay={togglePlay}
            volume={volume}
            handleVolumeChange={handleVolumeChange}
            currentTime={currentTime}
            duration={duration}
            onSeek={onSeek}
            onNext={handleNextPulse}
            onPrev={handlePrevPulse}
            trackTitle={currentPulse?.title}
            trackGenre={currentPulse?.genre}
            nextTrackTitle={
              pulses[(currentPulseIndex + 1) % pulses.length]?.title
            }
            nextTrackGenre={
              pulses[(currentPulseIndex + 1) % pulses.length]?.genre
            }
          />
        </div>
      </div>

      {!hasStarted && (
        <div
          className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm cursor-pointer"
          onClick={handleStart}
        >
          <h1
            className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-pink-500 tracking-tighter italic animate-pulse drop-shadow-[0_0_15px_rgba(0,255,255,0.8)]"
            style={{ textShadow: "4px 4px 0px rgba(255,0,255,0.5)" }}
          >
            PRESS START
          </h1>
          <p className="mt-8 text-cyan-300 font-mono text-xl tracking-[0.5em] animate-bounce">
            [ CLICK TO INSERT_COIN ]
          </p>
          {pulses.length > 0 && (
            <p className="mt-4 text-pink-400 font-mono text-sm">
              {pulses.length} TRACKS LOADED
            </p>
          )}
        </div>
      )}

      <style jsx global>{`
        .perspective-grid-floor {
          transform: perspective(100vh) rotateX(60deg) scale(2);
          transform-origin: bottom;
          background-image: linear-gradient(
              rgba(255, 0, 255, 0.3) 1px,
              transparent 1px
            ),
            linear-gradient(90deg, rgba(0, 255, 255, 0.3) 1px, transparent 1px);
          background-size: 80px 80px;
          background-position: 0 0;
          animation: gridMoveFloor 4s linear infinite;
        }

        .perspective-grid-ceiling {
          transform: perspective(100vh) rotateX(-60deg) scale(2);
          transform-origin: top;
          background-image: linear-gradient(
              rgba(255, 0, 255, 0.3) 1px,
              transparent 1px
            ),
            linear-gradient(90deg, rgba(0, 255, 255, 0.3) 1px, transparent 1px);
          background-size: 80px 80px;
          background-position: 0 0;
          animation: gridMoveCeiling 4s linear infinite;
        }

        .writing-vertical-rl {
          writing-mode: vertical-rl;
          text-orientation: upright;
        }

        @keyframes gridMoveFloor {
          from {
            background-position: 0 0;
          }
          to {
            background-position: 0 80px;
          }
        }

        @keyframes gridMoveCeiling {
          from {
            background-position: 0 0;
          }
          to {
            background-position: 0 -80px;
          }
        }

        .animate-flicker {
          animation: flicker 4s infinite;
        }
      `}</style>
    </div>
  );
}
