"use client";

import { useState } from "react";
import { Workout, WorkoutFormData } from "@/types/workout";

interface WorkoutResultProps {
  workout: Workout;
  formData: WorkoutFormData;
  onRegenerate: () => void;
  isLoading: boolean;
}

function workoutToText(workout: Workout, formData: WorkoutFormData): string {
  const lines: string[] = [
    `🏋️ ${workout.nome}`,
    `📋 ${workout.descricao}`,
    `⏱️ Duração estimada: ${workout.duracao_estimada}`,
    `🎯 Objetivo: ${formData.goal} | Nível: ${formData.level}`,
    `💪 Foco: ${formData.muscleGroup} | Equipamento: ${formData.equipment}`,
    "",
    "─────────────────────────────",
    "EXERCÍCIOS",
    "─────────────────────────────",
    "",
  ];

  workout.exercicios.forEach((ex, i) => {
    lines.push(`${i + 1}. ${ex.nome}`);
    lines.push(`   ${ex.series} séries × ${ex.repeticoes} reps | Descanso: ${ex.descanso}`);
    lines.push(`   💡 ${ex.dica}`);
    lines.push("");
  });

  lines.push("─────────────────────────────");
  lines.push(`📌 ${workout.observacao_final}`);
  lines.push("");
  lines.push("Gerado por FitGen ⚡");

  return lines.join("\n");
}

export default function WorkoutResult({
  workout,
  formData,
  onRegenerate,
  isLoading,
}: WorkoutResultProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const text = workoutToText(workout, formData);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header do treino */}
      <div className="relative rounded-2xl overflow-hidden border border-orange-500/30 bg-gradient-to-br from-orange-500/10 via-gray-900 to-gray-900 p-6">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -translate-y-16 translate-x-16" />
        <div className="relative">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-orange-400 text-xs font-semibold uppercase tracking-widest mb-1">
                Treino Gerado
              </p>
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
            {[formData.muscleGroup, formData.level, formData.goal, formData.equipment].map((tag) => (
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

      {/* Lista de exercícios */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest px-1">
          {workout.exercicios.length} Exercícios
        </h3>

        {workout.exercicios.map((ex, index) => (
          <div
            key={index}
            className="group rounded-xl border border-gray-800 bg-gray-900 hover:border-orange-500/30 hover:bg-gray-900/80 transition-all duration-200 p-4"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <div className="flex items-start gap-4">
              {/* Número */}
              <div className="shrink-0 w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                <span className="text-orange-400 text-sm font-bold">
                  {index + 1}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-white font-semibold text-sm leading-snug">
                  {ex.nome}
                </h4>

                {/* Stats */}
                <div className="flex flex-wrap gap-2 mt-2">
                  <StatBadge
                    icon="🔁"
                    label="Séries"
                    value={`${ex.series}x`}
                    accent
                  />
                  <StatBadge icon="💪" label="Reps" value={ex.repeticoes} />
                  <StatBadge icon="⏸️" label="Descanso" value={ex.descanso} />
                </div>

                {/* Dica */}
                <p className="mt-2.5 text-gray-500 text-xs leading-relaxed border-l-2 border-gray-700 pl-2.5 group-hover:border-orange-500/30 group-hover:text-gray-400 transition-all">
                  💡 {ex.dica}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Observação final */}
      <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
        <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1.5">
          📌 Dica do Personal
        </p>
        <p className="text-gray-300 text-sm leading-relaxed">
          {workout.observacao_final}
        </p>
      </div>

      {/* Ações */}
      <div className="flex gap-3">
        <button
          onClick={handleCopy}
          className="flex-1 py-3.5 rounded-xl text-sm font-semibold border border-gray-700 bg-gray-800 hover:border-gray-600 hover:bg-gray-750 text-gray-300 hover:text-white transition-all duration-200 active:scale-[0.98]"
        >
          {copied ? (
            <span className="flex items-center justify-center gap-2 text-green-400">
              <span>✓</span> Copiado!
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span>📋</span> Copiar Treino
            </span>
          )}
        </button>

        <button
          onClick={onRegenerate}
          disabled={isLoading}
          className="flex-1 py-3.5 rounded-xl text-sm font-bold
            bg-gradient-to-r from-orange-500 to-orange-600
            hover:from-orange-400 hover:to-orange-500
            text-white shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40
            disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
            transition-all duration-200 active:scale-[0.98]"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Gerando...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span>⚡</span> Gerar Outro
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

function StatBadge({
  icon,
  label,
  value,
  accent,
}: {
  icon: string;
  label: string;
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
