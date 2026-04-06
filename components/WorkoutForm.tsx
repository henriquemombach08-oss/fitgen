"use client";

import { useState } from "react";
import {
  WorkoutFormData,
  MuscleGroup,
  Equipment,
  Duration,
  Level,
  Goal,
} from "@/types/workout";

interface WorkoutFormProps {
  onSubmit: (data: WorkoutFormData) => void;
  isLoading: boolean;
}

const muscleGroups: MuscleGroup[] = [
  "Peito",
  "Costas",
  "Pernas",
  "Ombros",
  "Braços",
  "Full Body",
];

const equipments: Equipment[] = [
  "Academia completa",
  "Halteres",
  "Barra + anilhas",
  "Sem equipamento",
];

const durations: Duration[] = ["30 min", "45 min", "60 min", "90 min"];

const levels: Level[] = ["Iniciante", "Intermediário", "Avançado"];

const goals: Goal[] = [
  "Hipertrofia",
  "Força",
  "Resistência",
  "Emagrecimento",
];

const muscleIcons: Record<MuscleGroup, string> = {
  Peito: "🫁",
  Costas: "🔙",
  Pernas: "🦵",
  Ombros: "💪",
  Braços: "💪",
  "Full Body": "⚡",
};

const goalIcons: Record<Goal, string> = {
  Hipertrofia: "📈",
  Força: "🏋️",
  Resistência: "🏃",
  Emagrecimento: "🔥",
};

function SelectGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  icons,
}: {
  label: string;
  options: T[];
  value: T;
  onChange: (v: T) => void;
  icons?: Record<string, string>;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-300 uppercase tracking-wider">
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${
              value === opt
                ? "bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/25"
                : "bg-gray-800 border-gray-700 text-gray-300 hover:border-orange-500/50 hover:text-white"
            }`}
          >
            {icons?.[opt] && <span className="mr-1">{icons[opt]}</span>}
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function WorkoutForm({ onSubmit, isLoading }: WorkoutFormProps) {
  const [form, setForm] = useState<WorkoutFormData>({
    muscleGroup: "Full Body",
    equipment: "Academia completa",
    duration: "60 min",
    level: "Intermediário",
    goal: "Hipertrofia",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <SelectGroup
        label="Grupo Muscular"
        options={muscleGroups}
        value={form.muscleGroup}
        onChange={(v) => setForm((f) => ({ ...f, muscleGroup: v }))}
        icons={muscleIcons}
      />

      <SelectGroup
        label="Equipamento"
        options={equipments}
        value={form.equipment}
        onChange={(v) => setForm((f) => ({ ...f, equipment: v }))}
      />

      <SelectGroup
        label="Tempo Disponível"
        options={durations}
        value={form.duration}
        onChange={(v) => setForm((f) => ({ ...f, duration: v }))}
      />

      <SelectGroup
        label="Nível"
        options={levels}
        value={form.level}
        onChange={(v) => setForm((f) => ({ ...f, level: v }))}
      />

      <SelectGroup
        label="Objetivo"
        options={goals}
        value={form.goal}
        onChange={(v) => setForm((f) => ({ ...f, goal: v }))}
        icons={goalIcons}
      />

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-4 rounded-xl font-bold text-base tracking-wide transition-all duration-200
          bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500
          text-white shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50
          disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
          active:scale-[0.98]"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Gerando treino...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <span>⚡</span> Gerar Treino
          </span>
        )}
      </button>
    </form>
  );
}
