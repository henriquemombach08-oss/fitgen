"use client";

import { useState } from "react";
import { Workout } from "@/types/workout";

interface SetData {
  weight: string;
  reps: string;
  done: boolean;
}

interface WorkoutModeProps {
  workout: Workout;
  onClose: () => void;
}

export default function WorkoutMode({ workout, onClose }: WorkoutModeProps) {
  const [current, setCurrent] = useState(0);
  const [setData, setSetData] = useState<Record<number, Record<number, SetData>>>({});

  const total = workout.exercicios.length;
  const ex = workout.exercicios[current];

  function getSetData(exIdx: number, setIdx: number): SetData {
    return setData[exIdx]?.[setIdx] ?? { weight: "", reps: "", done: false };
  }

  function updateSetData(exIdx: number, setIdx: number, patch: Partial<SetData>) {
    setSetData((prev) => ({
      ...prev,
      [exIdx]: {
        ...(prev[exIdx] ?? {}),
        [setIdx]: { ...getSetData(exIdx, setIdx), ...patch },
      },
    }));
  }

  const isFirst = current === 0;
  const isLast = current === total - 1;

  return (
    <div className="fixed inset-0 z-50 bg-gray-950 flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between gap-4">
        <p className="text-sm font-semibold text-gray-300 truncate flex-1">
          {workout.nome}
        </p>
        <p className="text-xs text-gray-500 shrink-0">
          Exercício {current + 1} / {total}
        </p>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-white transition-colors shrink-0 text-lg leading-none"
          aria-label="Fechar modo treino"
        >
          ✕
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <p className="text-orange-500 text-7xl font-black leading-none mb-2">
          {current + 1}
        </p>
        <h2 className="text-white text-2xl font-bold mb-4">{ex.nome}</h2>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-orange-500/10 border border-orange-500/20 text-orange-300">
            🔁 {ex.series}×{ex.repeticoes}
          </span>
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-500/10 border border-blue-500/20 text-blue-300">
            ⏸️ {ex.descanso}
          </span>
        </div>

        {/* Tip */}
        <p className="text-gray-500 text-sm mt-3 leading-relaxed border-l-2 border-gray-800 pl-2.5">
          💡 {ex.dica}
        </p>

        {/* Set checklist */}
        <div className="mt-6 space-y-2">
          {Array.from({ length: ex.series }, (_, setIdx) => {
            const sd = getSetData(current, setIdx);
            return (
              <div
                key={setIdx}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                  sd.done
                    ? "bg-green-500/10 border-green-500/30"
                    : "bg-gray-900 border-gray-800"
                }`}
              >
                <span
                  className={`text-xs font-bold w-5 shrink-0 ${
                    sd.done ? "text-green-400" : "text-gray-600"
                  }`}
                >
                  {setIdx + 1}
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Peso"
                  value={sd.weight}
                  onChange={(e) =>
                    updateSetData(current, setIdx, { weight: e.target.value })
                  }
                  style={{ width: 70 }}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-orange-500/50 placeholder-gray-600"
                />
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Reps"
                  value={sd.reps}
                  onChange={(e) =>
                    updateSetData(current, setIdx, { reps: e.target.value })
                  }
                  style={{ width: 50 }}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-orange-500/50 placeholder-gray-600"
                />
                <button
                  onClick={() =>
                    updateSetData(current, setIdx, { done: !sd.done })
                  }
                  className={`ml-auto w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-colors ${
                    sd.done
                      ? "bg-green-500 text-white"
                      : "bg-gray-800 border border-gray-700 text-gray-500 hover:border-green-500/40 hover:text-green-400"
                  }`}
                >
                  ✓
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="px-4 py-4 border-t border-gray-800 flex gap-3">
        <button
          onClick={() => setCurrent((c) => c - 1)}
          disabled={isFirst}
          className="flex-1 py-3 rounded-xl font-bold text-sm bg-gray-800 border border-gray-700 text-gray-300 disabled:opacity-30 transition-colors"
        >
          ← Anterior
        </button>
        {isLast ? (
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-bold text-sm bg-orange-500 hover:bg-orange-600 text-white transition-colors"
          >
            ✓ Concluir
          </button>
        ) : (
          <button
            onClick={() => setCurrent((c) => c + 1)}
            className="flex-1 py-3 rounded-xl font-bold text-sm bg-orange-500 hover:bg-orange-600 text-white transition-colors"
          >
            Próximo →
          </button>
        )}
      </div>
    </div>
  );
}
