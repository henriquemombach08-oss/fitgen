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

const basicMuscleGroups: MuscleGroup[] = [
  "Peito",
  "Costas",
  "Pernas",
  "Ombros",
  "Braços",
  "Full Body",
];

const advancedMuscleGroups: MuscleGroup[] = [
  ...basicMuscleGroups,
  "Glúteos",
  "Core / Abdômen",
  "Panturrilha",
  "Push (Peito + Ombro + Tríceps)",
  "Pull (Costas + Bíceps)",
  "Upper Body",
];

const basicEquipments: Equipment[] = [
  "Academia completa",
  "Halteres",
  "Barra + anilhas",
  "Sem equipamento",
];

const advancedEquipments: Equipment[] = [
  ...basicEquipments,
  "Cabo / Polia",
  "Máquinas",
  "Kettlebell",
];

const basicDurations: Duration[] = ["30 min", "45 min", "60 min", "90 min"];
const advancedDurations: Duration[] = [...basicDurations, "120 min"];

const levels: Level[] = ["Iniciante", "Intermediário", "Avançado"];

const basicGoals: Goal[] = ["Hipertrofia", "Força", "Resistência", "Emagrecimento"];
const advancedGoals: Goal[] = [...basicGoals, "Potência"];

const muscleIcons: Record<MuscleGroup, string> = {
  Peito: "🫁",
  Costas: "🔙",
  Pernas: "🦵",
  Ombros: "💪",
  Braços: "💪",
  "Full Body": "⚡",
  Glúteos: "🍑",
  "Core / Abdômen": "🎯",
  Panturrilha: "🦶",
  "Push (Peito + Ombro + Tríceps)": "🚀",
  "Pull (Costas + Bíceps)": "🧲",
  "Upper Body": "🏆",
};

const goalIcons: Record<Goal, string> = {
  Hipertrofia: "📈",
  Força: "🏋️",
  Resistência: "🏃",
  Emagrecimento: "🔥",
  Potência: "⚡",
};

function SelectGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  icons,
  advanced,
  basicCount,
}: {
  label: string;
  options: T[];
  value: T;
  onChange: (v: T) => void;
  icons?: Record<string, string>;
  advanced?: boolean;
  basicCount?: number;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-300 uppercase tracking-wider">
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt, idx) => {
          const isAdvancedOption = advanced && basicCount !== undefined && idx >= basicCount;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${
                value === opt
                  ? isAdvancedOption
                    ? "bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/25"
                    : "bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/25"
                  : isAdvancedOption
                  ? "bg-gray-800 border-violet-800/50 text-violet-300 hover:border-violet-500/50 hover:text-white"
                  : "bg-gray-800 border-gray-700 text-gray-300 hover:border-orange-500/50 hover:text-white"
              }`}
            >
              {icons?.[opt] && <span className="mr-1">{icons[opt]}</span>}
              {opt}
            </button>
          );
        })}
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
    advancedMode: false,
  });

  function toggleAdvanced() {
    const next = !form.advancedMode;
    setForm((f) => {
      const basicMGs = basicMuscleGroups as readonly string[];
      const basicEqs = basicEquipments as readonly string[];
      const basicDurs = basicDurations as readonly string[];
      const basicGs = basicGoals as readonly string[];
      return {
        ...f,
        advancedMode: next,
        muscleGroup: !next && !basicMGs.includes(f.muscleGroup) ? "Full Body" : f.muscleGroup,
        equipment: !next && !basicEqs.includes(f.equipment) ? "Academia completa" : f.equipment,
        duration: !next && !basicDurs.includes(f.duration) ? "60 min" : f.duration,
        goal: !next && !basicGs.includes(f.goal) ? "Hipertrofia" : f.goal,
      };
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(form);
  }

  const muscleGroups = form.advancedMode ? advancedMuscleGroups : basicMuscleGroups;
  const equipments = form.advancedMode ? advancedEquipments : basicEquipments;
  const durations = form.advancedMode ? advancedDurations : basicDurations;
  const goals = form.advancedMode ? advancedGoals : basicGoals;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Toggle Modo Avançado */}
      <button
        type="button"
        onClick={toggleAdvanced}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-300 ${
          form.advancedMode
            ? "bg-violet-600/15 border-violet-500/40 text-violet-300 shadow-lg shadow-violet-500/10"
            : "bg-gray-800/60 border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <span className="text-base">{form.advancedMode ? "🔓" : "🔒"}</span>
          <div className="text-left">
            <p className="text-sm font-semibold leading-none">
              {form.advancedMode ? "Modo Avançado Ativo" : "Modo Avançado"}
            </p>
            <p className="text-xs mt-0.5 opacity-70">
              {form.advancedMode
                ? "Grupos extras, técnicas avançadas e mais"
                : "Desbloqueie grupos musculares e técnicas extras"}
            </p>
          </div>
        </div>
        <div
          className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${
            form.advancedMode ? "bg-violet-600" : "bg-gray-700"
          }`}
        >
          <div
            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${
              form.advancedMode ? "left-5" : "left-0.5"
            }`}
          />
        </div>
      </button>

      <SelectGroup
        label="Grupo Muscular"
        options={muscleGroups}
        value={form.muscleGroup}
        onChange={(v) => setForm((f) => ({ ...f, muscleGroup: v }))}
        icons={muscleIcons}
        advanced={form.advancedMode}
        basicCount={basicMuscleGroups.length}
      />

      <SelectGroup
        label="Equipamento"
        options={equipments}
        value={form.equipment}
        onChange={(v) => setForm((f) => ({ ...f, equipment: v }))}
        advanced={form.advancedMode}
        basicCount={basicEquipments.length}
      />

      <SelectGroup
        label="Tempo Disponível"
        options={durations}
        value={form.duration}
        onChange={(v) => setForm((f) => ({ ...f, duration: v }))}
        advanced={form.advancedMode}
        basicCount={basicDurations.length}
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
        advanced={form.advancedMode}
        basicCount={basicGoals.length}
      />

      {form.advancedMode && (
        <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 px-4 py-3">
          <p className="text-xs text-violet-400 font-semibold mb-1">⚡ Modo Avançado</p>
          <p className="text-xs text-gray-400 leading-relaxed">
            Treino com 8–12 exercícios, técnicas de supersets, drop sets e periodização avançada.
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className={`w-full py-4 rounded-xl font-bold text-base tracking-wide transition-all duration-200
          text-white shadow-lg
          disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
          active:scale-[0.98] ${
            form.advancedMode
              ? "bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-500 hover:to-violet-600 shadow-violet-500/30 hover:shadow-violet-500/50"
              : "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 shadow-orange-500/30 hover:shadow-orange-500/50"
          }`}
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
            <span>{form.advancedMode ? "🚀" : "⚡"}</span>
            {form.advancedMode ? "Gerar Treino Avançado" : "Gerar Treino"}
          </span>
        )}
      </button>
    </form>
  );
}
