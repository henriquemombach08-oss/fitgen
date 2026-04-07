"use client";

import { Workout, WorkoutFormData } from "@/types/workout";

interface WorkoutResultReadonlyProps {
  workout: Workout;
  formData: WorkoutFormData;
}

function StatBadge({
  icon,
  value,
  accent,
}: {
  icon: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${
        accent
          ? "bg-orange-500/15 border border-orange-500/25 text-orange-300"
          : "bg-gray-800 border border-gray-700 text-gray-400"
      }`}
    >
      <span>{icon}</span>
      <span>{value}</span>
    </div>
  );
}

export default function WorkoutResultReadonly({
  workout,
  formData,
}: WorkoutResultReadonlyProps) {
  return (
    <div className="space-y-6">
      {/* Workout header */}
      <div className="relative rounded-2xl overflow-hidden border border-orange-500/30 bg-gradient-to-br from-orange-500/10 via-gray-900 to-gray-900 p-6">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -translate-y-16 translate-x-16" />
        <div className="relative">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-orange-400 text-xs font-semibold uppercase tracking-widest">
                  Treino Gerado
                </p>
                {formData.advancedMode && (
                  <span className="bg-violet-600/20 border border-violet-500/30 text-violet-300 text-xs font-bold px-2 py-0.5 rounded-md">
                    ⚡ AVANÇADO
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-black text-white leading-tight">
                {workout.nome}
              </h2>
            </div>
            <span className="shrink-0 bg-orange-500/20 border border-orange-500/40 text-orange-300 text-sm font-semibold px-3 py-1.5 rounded-lg">
              ⏱ {workout.duracao_estimada}
            </span>
          </div>
          <p className="mt-3 text-gray-300 text-sm leading-relaxed">
            {workout.descricao}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-4">
            {[
              ...formData.muscleGroups,
              ...formData.goals,
              formData.level,
              formData.equipment,
            ].map((tag) => (
              <span
                key={tag}
                className="bg-gray-800 border border-gray-700 text-gray-400 text-xs px-2.5 py-1 rounded-md"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Exercise list */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest px-1">
          {workout.exercicios.length} Exercícios
        </h3>

        {workout.exercicios.map((ex, index) => (
          <div
            key={index}
            className="group rounded-xl border border-gray-800 bg-gray-900 hover:border-orange-500/30 hover:bg-gray-900/80 transition-all duration-200 p-4"
          >
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                <span className="text-orange-400 text-sm font-bold">
                  {index + 1}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-white font-semibold text-sm leading-snug">
                  {ex.nome}
                </h4>

                <div className="flex flex-wrap gap-2 mt-2">
                  <StatBadge icon="🔁" value={`${ex.series}x`} accent />
                  <StatBadge icon="💪" value={ex.repeticoes} />
                  <StatBadge icon="⏸️" value={ex.descanso} />
                </div>

                <p className="mt-2.5 text-gray-500 text-xs leading-relaxed border-l-2 border-gray-700 pl-2.5 group-hover:border-orange-500/30 group-hover:text-gray-400 transition-all">
                  💡 {ex.dica}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Final tip */}
      <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
        <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1.5">
          📌 Dica do Personal
        </p>
        <p className="text-gray-300 text-sm leading-relaxed">
          {workout.observacao_final}
        </p>
      </div>
    </div>
  );
}
