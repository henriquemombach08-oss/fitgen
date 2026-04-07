"use client";

const LEVEL_LABELS: Record<number, string> = {
  [-2]: "Muito Fácil",
  [-1]: "Fácil",
  [0]: "Normal",
  [1]: "Difícil",
  [2]: "Muito Difícil",
};

const LEVEL_COLORS: Record<number, string> = {
  [-2]: "bg-blue-500/20 border-blue-500/40 text-blue-300",
  [-1]: "bg-sky-500/20 border-sky-500/40 text-sky-300",
  [0]: "bg-gray-700/60 border-gray-600 text-gray-300",
  [1]: "bg-orange-500/20 border-orange-500/40 text-orange-300",
  [2]: "bg-red-500/20 border-red-500/40 text-red-300",
};

interface DifficultyAdjusterProps {
  onAdjust: (direction: "easier" | "harder") => Promise<void>;
  isLoading: boolean;
  currentLevel: number;
}

export default function DifficultyAdjuster({
  onAdjust,
  isLoading,
  currentLevel,
}: DifficultyAdjusterProps) {
  const label = LEVEL_LABELS[currentLevel] ?? "Normal";
  const pillColor = LEVEL_COLORS[currentLevel] ?? LEVEL_COLORS[0];

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
          Dificuldade
        </p>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${pillColor} transition-colors duration-300`}
          >
            {label}
          </span>
          {currentLevel !== 0 && !isLoading && (
            <button
              onClick={() => {
                // Reset is handled externally — this calls onAdjust in the direction to reach 0
                // We just signal with a no-op visual; parent resets the level
              }}
              className="text-xs text-gray-600 hover:text-gray-400 underline transition-colors"
              title="Resetar ao nível normal (gere um novo treino)"
            >
              Resetar
            </button>
          )}
        </div>
      </div>

      {/* Level pills row */}
      <div className="flex gap-1 justify-between">
        {([-2, -1, 0, 1, 2] as const).map((lvl) => (
          <div
            key={lvl}
            className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
              lvl === currentLevel
                ? lvl < 0
                  ? "bg-blue-400"
                  : lvl === 0
                  ? "bg-gray-400"
                  : "bg-orange-500"
                : "bg-gray-800"
            }`}
          />
        ))}
      </div>

      <div className="flex gap-3">
        <button
          disabled={isLoading || currentLevel <= -2}
          onClick={() => onAdjust("easier")}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-700 bg-gray-800 hover:border-blue-500/40 hover:text-blue-300 text-gray-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-1.5">
              <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </span>
          ) : (
            "← Mais Fácil"
          )}
        </button>

        <button
          disabled={isLoading || currentLevel >= 2}
          onClick={() => onAdjust("harder")}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-700 bg-gray-800 hover:border-orange-500/40 hover:text-orange-300 text-gray-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-1.5">
              <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </span>
          ) : (
            "Mais Difícil →"
          )}
        </button>
      </div>
    </div>
  );
}
