"use client";

import { useState } from "react";
import { SetLog } from "@/types/workout";

interface SetLoggerProps {
  totalSets: number;
  targetReps: string;
  descanso: string;
  logs: SetLog[];
  onUpdate: (setIndex: number, field: keyof SetLog, value: string) => void;
}

export default function SetLogger({
  totalSets,
  targetReps,
  descanso,
  logs,
  onUpdate,
}: SetLoggerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const filledCount = logs.filter((l) => l.weight || l.reps).length;
  const allFilled = filledCount === totalSets && totalSets > 0;

  return (
    <div className="mt-3 border-t border-gray-800 pt-3">
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className={`flex items-center gap-2 w-full text-xs font-semibold transition-colors duration-150 ${
          allFilled
            ? "text-green-400 hover:text-green-300"
            : filledCount > 0
            ? "text-orange-400/80 hover:text-orange-300"
            : "text-gray-600 hover:text-gray-400"
        }`}
      >
        <span className="text-sm">{allFilled ? "✅" : "📝"}</span>
        <span>Registrar séries</span>
        {filledCount > 0 && (
          <span
            className={`px-1.5 py-0.5 rounded-md ${
              allFilled
                ? "bg-green-500/15 text-green-400"
                : "bg-orange-500/15 text-orange-400"
            }`}
          >
            {filledCount}/{totalSets}
          </span>
        )}
        {filledCount === 0 && (
          <span className="text-gray-700 font-normal">— peso, reps, obs.</span>
        )}
        <span
          className={`ml-auto transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        >
          ▾
        </span>
      </button>

      {/* Expanded */}
      {isOpen && (
        <div className="mt-2.5 space-y-2">
          {/* Prescription reference bar */}
          <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg bg-gray-800/50 border border-gray-700/60">
            <span className="text-gray-500 text-xs">Meta:</span>
            <span className="text-orange-300/80 text-xs font-semibold">
              {totalSets}× {targetReps} reps
            </span>
            <span className="text-gray-700">·</span>
            <span className="text-gray-500 text-xs">⏸ {descanso} descanso</span>
          </div>

          {/* Set rows */}
          {Array.from({ length: totalSets }, (_, i) => (
            <div key={i} className="flex items-center gap-1.5">
              {/* Set number */}
              <span className="shrink-0 w-6 h-6 rounded-md bg-gray-800 border border-gray-700 flex items-center justify-center text-xs text-gray-500 font-bold">
                {i + 1}
              </span>

              {/* Weight */}
              <input
                type="text"
                inputMode="decimal"
                placeholder="Peso (ex: 20kg)"
                value={logs[i]?.weight ?? ""}
                onChange={(e) => onUpdate(i, "weight", e.target.value)}
                className="flex-1 min-w-0 bg-gray-800/60 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-orange-500/40 focus:bg-gray-800 transition-colors"
              />

              {/* Reps done */}
              <input
                type="text"
                inputMode="numeric"
                placeholder="Reps"
                value={logs[i]?.reps ?? ""}
                onChange={(e) => onUpdate(i, "reps", e.target.value)}
                className="w-16 shrink-0 bg-gray-800/60 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-orange-500/40 focus:bg-gray-800 transition-colors"
              />

              {/* Note */}
              <input
                type="text"
                placeholder="Obs."
                value={logs[i]?.note ?? ""}
                onChange={(e) => onUpdate(i, "note", e.target.value)}
                className="w-20 shrink-0 bg-gray-800/60 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-orange-500/40 focus:bg-gray-800 transition-colors"
              />
            </div>
          ))}

          {filledCount === 0 && (
            <p className="text-xs text-gray-700 italic pt-0.5">
              💡 Recomendado: registre peso e reps para acompanhar sua evolução
            </p>
          )}
        </div>
      )}
    </div>
  );
}
