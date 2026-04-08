"use client";

import { useState, useEffect, useRef } from "react";
import { SetLog } from "@/types/workout";

type Status = "idle" | "active" | "done";

interface ExerciseTrackerProps {
  exerciseIndex: number;
  totalSets: number;
  targetReps: string;
  descanso: string;
  logs: SetLog[];
  onAdd: (log: SetLog) => void;
  onClear: () => void;
  onStartTimer: (setNumber: number) => void;
}

export default function ExerciseTracker({
  totalSets,
  targetReps,
  descanso,
  logs,
  onAdd,
  onClear,
  onStartTimer,
}: ExerciseTrackerProps) {
  const [status, setStatus] = useState<Status>(() =>
    logs.length > 0 ? "done" : "idle"
  );
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const weightRef = useRef<HTMLInputElement>(null);

  // Focus weight field when entering active state
  useEffect(() => {
    if (status === "active") {
      setTimeout(() => weightRef.current?.focus(), 50);
    }
  }, [status, logs.length]);

  const currentSetNum = logs.length + 1;
  const hasMoreSets = logs.length < totalSets;

  function handleStart() {
    setWeight("");
    setReps("");
    setStatus("active");
  }

  function handleCompleteSet() {
    if (!weight && !reps) return;
    const completedSetNum = logs.length + 1;
    onAdd({ weight, reps, note: "" });
    onStartTimer(completedSetNum);
    setWeight("");
    setReps("");
    // If this was the last planned set, auto-finish
    if (completedSetNum >= totalSets) {
      setStatus("done");
    }
  }

  function handleFinish() {
    setStatus(logs.length > 0 ? "done" : "idle");
  }

  function handleRedo() {
    onClear();
    setStatus("idle");
  }

  // ── IDLE ──────────────────────────────────────────────────────────────────
  if (status === "idle") {
    return (
      <div className="mt-3 pt-3 border-t border-gray-800/60">
        <button
          onClick={handleStart}
          className="group flex items-center gap-2.5 text-xs font-semibold text-gray-600 hover:text-orange-400 transition-colors duration-150"
        >
          <span className="w-6 h-6 rounded-lg bg-gray-800 border border-gray-700 group-hover:border-orange-500/40 group-hover:bg-orange-500/10 flex items-center justify-center transition-all duration-150 text-[10px]">
            ▶
          </span>
          Iniciar exercício
        </button>
      </div>
    );
  }

  // ── ACTIVE ────────────────────────────────────────────────────────────────
  if (status === "active") {
    return (
      <div className="mt-3 pt-3 border-t border-orange-500/20 space-y-3">
        {/* Current set header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Set indicators */}
            <div className="flex gap-1">
              {Array.from({ length: totalSets }, (_, i) => (
                <span
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i < logs.length
                      ? "bg-green-400"
                      : i === logs.length
                      ? "bg-orange-400 animate-pulse"
                      : "bg-gray-700"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-white font-semibold">
              Série {currentSetNum}
              <span className="text-gray-600 font-normal"> / {totalSets}</span>
            </span>
            <span className="text-xs text-gray-600">· meta: {targetReps}</span>
          </div>
          <button
            onClick={handleFinish}
            className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
          >
            Finalizar
          </button>
        </div>

        {/* Completed sets chips */}
        {logs.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {logs.map((l, i) => (
              <span
                key={i}
                className="text-xs px-2 py-0.5 rounded-md bg-green-500/10 border border-green-500/20 text-green-400 font-medium"
              >
                {i + 1}: {l.weight || "—"} × {l.reps || "—"}
              </span>
            ))}
          </div>
        )}

        {/* Inputs */}
        <div className="flex gap-2">
          <input
            ref={weightRef}
            type="text"
            inputMode="decimal"
            placeholder="Peso (ex: 60kg)"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-orange-500/50 transition-colors"
          />
          <input
            type="text"
            inputMode="numeric"
            placeholder="Reps"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCompleteSet()}
            className="w-20 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-orange-500/50 transition-colors"
          />
        </div>

        {/* Complete set button */}
        <button
          onClick={handleCompleteSet}
          disabled={!weight && !reps}
          className="w-full py-2.5 rounded-xl text-sm font-bold transition-all duration-150 active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed
            bg-orange-500/15 border border-orange-500/30 text-orange-300
            hover:bg-orange-500/25 hover:border-orange-500/50 hover:text-orange-200"
        >
          {hasMoreSets && logs.length + 1 < totalSets
            ? `✓ Série ${currentSetNum} concluída →`
            : "✓ Concluir última série"}
        </button>

        {/* Finish early link */}
        {logs.length > 0 && (
          <button
            onClick={handleFinish}
            className="w-full text-xs text-gray-600 hover:text-gray-400 transition-colors py-1"
          >
            Finalizar exercício sem mais séries
          </button>
        )}
      </div>
    );
  }

  // ── DONE ──────────────────────────────────────────────────────────────────
  return (
    <div className="mt-3 pt-3 border-t border-gray-800/60">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-1.5">
          <p className="text-xs font-semibold text-green-400">
            ✅ {logs.length}/{totalSets}{" "}
            {logs.length === 1 ? "série" : "séries"} concluída
            {logs.length !== 1 ? "s" : ""}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {logs.map((l, i) => (
              <span
                key={i}
                className="text-xs px-2 py-0.5 rounded-md bg-gray-800 border border-gray-700 text-gray-400"
              >
                <span className="text-gray-600 mr-1">{i + 1}:</span>
                {l.weight || "—"} × {l.reps || "—"}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <button
            onClick={handleStart}
            className="text-xs text-orange-500/60 hover:text-orange-400 transition-colors font-semibold"
          >
            + série
          </button>
          <button
            onClick={handleRedo}
            className="text-xs text-gray-700 hover:text-gray-500 transition-colors"
          >
            Refazer
          </button>
        </div>
      </div>
    </div>
  );
}
