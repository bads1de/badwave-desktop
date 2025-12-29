"use client";

import { useState, useRef, useEffect } from "react";
import VaporwaveTheme from "@/components/pulse/VaporwaveTheme";
import CityPopTheme from "@/components/pulse/CityPopTheme";
import useGetPulses from "@/hooks/data/useGetPulses";

export default function PulsePage() {
  const { pulses, isLoading, error } = useGetPulses();

  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  const [hasStarted, setHasStarted] = useState(false);

  const [currentPulseIndex, setCurrentPulseIndex] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  const currentPulse = pulses[currentPulseIndex];
  const audioSrc = currentPulse?.music_path || "/music/demo.mp3";

  const handleStart = () => {
    if (!audioRef.current) return;

    if (!audioContextRef.current) {
      const AudioContext =
        (window as any).AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        const analyserNode = ctx.createAnalyser();
        analyserNode.fftSize = 2048;

        const source = ctx.createMediaElementSource(audioRef.current);
        source.connect(analyserNode);
        analyserNode.connect(ctx.destination);

        audioContextRef.current = ctx;
        sourceRef.current = source;
        setAnalyser(analyserNode);
      }
    }

    if (audioContextRef.current?.state === "suspended") {
      audioContextRef.current.resume();
    }

    audioRef.current.volume = volume;
    audioRef.current
      .play()
      .then(() => {
        setIsPlaying(true);
        setHasStarted(true);
      })
      .catch((e) => console.error("Playback failed:", e));
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const handleNextPulse = () => {
    if (pulses.length > 0) {
      setCurrentPulseIndex((prev) => (prev + 1) % pulses.length);
    }
  };

  const handlePrevPulse = () => {
    if (pulses.length > 0) {
      setCurrentPulseIndex(
        (prev) => (prev - 1 + pulses.length) % pulses.length
      );
    }
  };

  useEffect(() => {
    if (hasStarted && audioRef.current) {
      audioRef.current.load();
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((e) => console.error("Playback failed:", e));
    }
  }, [currentPulseIndex, hasStarted]);

  const handleAudioEnded = () => {
    handleNextPulse();
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const onSeek = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime += seconds;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
  };

  const isCityPop =
    currentPulse?.genre?.toLowerCase().includes("city") ||
    currentPulse?.genre?.toLowerCase().includes("pop");

  const commonProps = {
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
  } as any;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-theme-900 via-neutral-900 to-black">
        <p className="text-center text-theme-400 animate-pulse text-xl">
          LOADING...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-theme-900 via-neutral-900 to-black">
        <p className="text-red-500 text-center text-xl">{error.message}</p>
      </div>
    );
  }

  return (
    <>
      <audio
        ref={audioRef}
        src={audioSrc}
        crossOrigin="anonymous"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onEnded={handleAudioEnded}
        className="hidden"
      />

      {isCityPop ? (
        <CityPopTheme {...commonProps} />
      ) : (
        <VaporwaveTheme {...commonProps} />
      )}
    </>
  );
}
