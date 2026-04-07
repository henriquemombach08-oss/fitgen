"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface RestTimerProps {
  seconds: number;
  exerciseName: string;
  setNumber: number;
  totalSets: number;
  onComplete: () => void;
  onSkip: () => void;
}

function playBeep() {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.6);
  } catch {
    // Audio API not available
  }
}

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function RestTimer({
  seconds,
  exerciseName,
  setNumber,
  totalSets,
  onComplete,
  onSkip,
}: RestTimerProps) {
  const [remaining, setRemaining] = useState(seconds);
  const [paused, setPaused] = useState(false);
  const [done, setDone] = useState(false);
  const [visible, setVisible] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fade-in on mount
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  const handleComplete = useCallback(() => {
    setDone(true);
    playBeep();
    setTimeout(() => onComplete(), 1500);
  }, [onComplete]);

  useEffect(() => {
    if (paused || done) return;
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          handleComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [paused, done, handleComplete]);

  function handleSkip() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setVisible(false);
    setTimeout(() => onSkip(), 200);
  }

  const progress = seconds > 0 ? remaining / seconds : 0;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  const minutes = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const timeDisplay = minutes > 0
    ? `${minutes}:${String(secs).padStart(2, "0")}`
    : `${secs}s`;

  return (
    <div
      className={`fixed inset-0 z-50 bg-black/80 flex items-center justify-center transition-all duration-200 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        className={`bg-gray-950 border border-gray-800 rounded-2xl p-8 w-80 max-w-[90vw] shadow-2xl text-center transition-all duration-200 ${
          visible ? "scale-100" : "scale-95"
        }`}
      >
        {done ? (
          <div className="py-4 space-y-3 animate-fade-in">
            <div className="text-5xl">💪</div>
            <p className="text-white font-bold text-lg">Próxima série!</p>
            <p className="text-gray-400 text-sm">{exerciseName}</p>
          </div>
        ) : (
          <>
            <p className="text-orange-400 text-xs font-semibold uppercase tracking-widest mb-1">
              Descanso
            </p>
            <p className="text-gray-300 text-sm font-medium mb-1 truncate">{exerciseName}</p>
            <p className="text-gray-500 text-xs mb-6">
              Série {setNumber} / {totalSets}
            </p>

            {/* SVG Circular Timer */}
            <div className="flex justify-center mb-6">
              <svg width="128" height="128" viewBox="0 0 128 128">
                {/* Background circle */}
                <circle
                  cx="64"
                  cy="64"
                  r={RADIUS}
                  fill="none"
                  stroke="#1f2937"
                  strokeWidth="8"
                />
                {/* Progress arc */}
                <circle
                  cx="64"
                  cy="64"
                  r={RADIUS}
                  fill="none"
                  stroke={remaining <= 5 ? "#ef4444" : "#f97316"}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={dashOffset}
                  transform="rotate(-90 64 64)"
                  style={{ transition: "stroke-dashoffset 0.9s linear, stroke 0.3s" }}
                />
                <text
                  x="64"
                  y="64"
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="fill-white font-bold"
                  fontSize="22"
                  fontWeight="bold"
                  fill="white"
                >
                  {timeDisplay}
                </text>
              </svg>
            </div>

            {/* Controls */}
            <div className="flex gap-3">
              <button
                onClick={() => setPaused((p) => !p)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-700 bg-gray-800 hover:border-gray-600 text-gray-300 hover:text-white transition-all"
              >
                {paused ? "▶ Retomar" : "⏸ Pausar"}
              </button>
              <button
                onClick={handleSkip}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-orange-500/20 border border-orange-500/40 text-orange-300 hover:bg-orange-500/30 hover:text-orange-200 transition-all"
              >
                Pular →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
