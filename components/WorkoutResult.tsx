"use client";

import { useState, useCallback } from "react";
import { Workout, WorkoutFormData, Exercise, SavedWorkout } from "@/types/workout";
import ShareButton from "@/components/ShareButton";
import FavoriteButton from "@/components/FavoriteButton";
import WorkoutRating from "@/components/WorkoutRating";
import RestTimer from "@/components/RestTimer";
import DifficultyAdjuster from "@/components/DifficultyAdjuster";
import ExerciseTracker from "@/components/ExerciseTracker";
import WorkoutReport from "@/components/WorkoutReport";
import { parseRestTime } from "@/utils/parseRestTime";
import { useSetLogs } from "@/hooks/useSetLogs";

interface WorkoutResultProps {
  workout: Workout;
  formData: WorkoutFormData;
  onRegenerate: () => void;
  isLoading: boolean;
  // Agente 1 — Histórico + Favoritar
  savedWorkout?: SavedWorkout | null;
  onToggleFavorite?: () => void;
  onOpenHistory?: () => void;
}

// ─── Timer state ────────────────────────────────────────────────────────────
interface TimerState {
  exerciseIndex: number;
  setNumber: number;
  seconds: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function workoutToText(workout: Workout, formData: WorkoutFormData): string {
  const lines: string[] = [
    `🏋️ ${workout.nome}`,
    `📋 ${workout.descricao}`,
    `⏱️ Duração estimada: ${workout.duracao_estimada}`,
    `🎯 Objetivos: ${formData.goals.join(", ")} | Nível: ${formData.level}`,
    `💪 Foco: ${formData.muscleGroups.join(", ")} | Equipamento: ${formData.equipment}`,
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

async function exportToPDF(workout: Workout, formData: WorkoutFormData) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const pageW = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentW = pageW - margin * 2;
  let y = 0;

  function addPage() {
    doc.addPage();
    y = margin;
  }

  function checkY(needed: number) {
    if (y + needed > doc.internal.pageSize.getHeight() - margin) {
      addPage();
    }
  }

  // ── Header bar
  doc.setFillColor(249, 115, 22);
  doc.rect(0, 0, pageW, 18, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("FitGen", margin, 12);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Treino gerado por IA", pageW - margin, 12, { align: "right" });

  y = 30;

  // ── Modo avançado badge
  if (formData.advancedMode) {
    doc.setFillColor(109, 40, 217);
    doc.roundedRect(margin, y - 5, 38, 7, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text("MODO AVANCADO", margin + 2, y);
    y += 8;
  }

  // ── Workout name
  doc.setTextColor(15, 15, 15);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  const nameLines = doc.splitTextToSize(workout.nome, contentW);
  doc.text(nameLines, margin, y);
  y += nameLines.length * 8 + 2;

  // ── Description
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  const descLines = doc.splitTextToSize(workout.descricao, contentW);
  doc.text(descLines, margin, y);
  y += descLines.length * 5 + 6;

  // ── Tags row
  const tags = [
    ...formData.muscleGroups.map((g) => ({ label: g })),
    ...formData.goals.map((g) => ({ label: g })),
    { label: formData.level },
    { label: formData.equipment },
    { label: workout.duracao_estimada },
  ];
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  let tagX = margin;
  tags.forEach((tag) => {
    const tw = doc.getTextWidth(tag.label) + 6;
    doc.setFillColor(245, 245, 245);
    doc.setDrawColor(200, 200, 200);
    doc.roundedRect(tagX, y - 4, tw, 7, 2, 2, "FD");
    doc.setTextColor(60, 60, 60);
    doc.text(tag.label, tagX + 3, y);
    tagX += tw + 3;
  });
  y += 10;

  // ── Divider
  doc.setDrawColor(229, 229, 229);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageW - margin, y);
  y += 7;

  // ── Section title
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(150, 150, 150);
  doc.text(`${workout.exercicios.length} EXERCICIOS`, margin, y);
  y += 8;

  // ── Exercises
  workout.exercicios.forEach((ex, index) => {
    checkY(28);

    doc.setFillColor(249, 115, 22);
    doc.circle(margin + 4, y - 1, 4, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(String(index + 1), margin + 4, y, { align: "center" });

    doc.setTextColor(15, 15, 15);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(ex.nome, margin + 12, y);
    y += 6;

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Series: ${ex.series}x   Reps: ${ex.repeticoes}   Descanso: ${ex.descanso}`,
      margin + 12,
      y
    );
    y += 5;

    doc.setFillColor(255, 251, 235);
    const tipLines = doc.splitTextToSize(`Dica: ${ex.dica}`, contentW - 14);
    const tipH = tipLines.length * 4.5 + 4;
    doc.roundedRect(margin + 12, y - 3, contentW - 12, tipH, 2, 2, "F");
    doc.setTextColor(120, 80, 20);
    doc.setFontSize(8);
    doc.text(tipLines, margin + 15, y);
    y += tipH + 3;
  });

  // ── Final tip box
  checkY(20);
  y += 2;
  doc.setDrawColor(59, 130, 246);
  doc.setFillColor(239, 246, 255);
  const obsLines = doc.splitTextToSize(workout.observacao_final, contentW - 6);
  const obsH = obsLines.length * 4.5 + 10;
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentW, obsH, 3, 3, "FD");
  doc.setTextColor(37, 99, 235);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("DICA DO PERSONAL", margin + 4, y + 5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(30, 58, 138);
  doc.text(obsLines, margin + 4, y + 10);
  y += obsH + 8;

  // ── Footer
  checkY(10);
  doc.setDrawColor(229, 229, 229);
  doc.line(margin, y, pageW - margin, y);
  y += 5;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(180, 180, 180);
  doc.text("Gerado por FitGen", margin, y);
  doc.text(new Date().toLocaleDateString("pt-BR"), pageW - margin, y, { align: "right" });

  const fileName = `${workout.nome.replace(/[^a-zA-Z0-9\s]/g, "").trim().replace(/\s+/g, "_")}.pdf`;
  doc.save(fileName);
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function WorkoutResult({
  workout,
  formData,
  onRegenerate,
  isLoading,
  savedWorkout,
  onToggleFavorite,
  onOpenHistory,
}: WorkoutResultProps) {
  // ── State: copy & PDF (original)
  const [copied, setCopied] = useState(false);
  const [savingPDF, setSavingPDF] = useState(false);

  // ── State: Agente 3 — currentWorkout (mutable copy for replace + difficulty)
  const [currentWorkout, setCurrentWorkout] = useState<Workout>(workout);

  // ── State: Agente 3 — difficulty level tracker
  const [difficultyLevel, setDifficultyLevel] = useState<number>(0);
  const [difficultyLoading, setDifficultyLoading] = useState(false);

  // ── State: Agente 3 — replace exercise
  const [replacingIndex, setReplacingIndex] = useState<number | null>(null);

  // ── State: Agente 3 — rest timer
  const [timerState, setTimerState] = useState<TimerState | null>(null);

  // ── Set logs (localStorage, keyed by workout id or nome)
  const workoutKey = savedWorkout?.id ?? workout.nome;
  const { logs: setLogs, addLog, clearExerciseLogs } = useSetLogs(workoutKey);

  // ─── Handlers: copy & PDF ────────────────────────────────────────────────
  async function handleCopy() {
    const text = workoutToText(currentWorkout, formData);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSavePDF() {
    setSavingPDF(true);
    try {
      await exportToPDF(currentWorkout, formData);
    } finally {
      setSavingPDF(false);
    }
  }

  // ─── Handler: difficulty adjust (Agente 3) ──────────────────────────────
  const handleAdjustDifficulty = useCallback(
    async (direction: "easier" | "harder") => {
      setDifficultyLoading(true);
      try {
        const res = await fetch("/api/adjust-difficulty", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workout: currentWorkout,
            formData,
            direction,
          }),
        });
        const json = await res.json();
        if (res.ok && json.workout) {
          setCurrentWorkout(json.workout);
          setDifficultyLevel((prev) =>
            direction === "easier"
              ? Math.max(prev - 1, -2)
              : Math.min(prev + 1, 2)
          );
        }
      } catch {
        // silently ignore network errors
      } finally {
        setDifficultyLoading(false);
      }
    },
    [currentWorkout, formData]
  );

  // ─── Handler: replace exercise (Agente 3) ───────────────────────────────
  async function handleReplaceExercise(index: number) {
    setReplacingIndex(index);
    try {
      const exercise = currentWorkout.exercicios[index];
      const allExerciseNames = currentWorkout.exercicios.map((e) => e.nome);

      const res = await fetch("/api/replace-exercise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exercise, formData, allExerciseNames }),
      });
      const json = await res.json();
      if (res.ok && json.exercise) {
        setCurrentWorkout((prev) => {
          const updated = [...prev.exercicios];
          updated[index] = json.exercise as Exercise;
          return { ...prev, exercicios: updated };
        });
      }
    } catch {
      // silently ignore
    } finally {
      setReplacingIndex(null);
    }
  }

  // ─── Handler: start rest timer (Agente 3) ───────────────────────────────
  function handleStartTimer(exerciseIndex: number, setNumber: number) {
    const descanso = currentWorkout.exercicios[exerciseIndex].descanso;
    const seconds = parseRestTime(descanso);
    setTimerState({ exerciseIndex, setNumber, seconds });
  }

  function handleTimerDone() {
    setTimerState(null);
  }

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Rest Timer Modal (Agente 3) ─────────────────────────────────── */}
      {timerState && (
        <RestTimer
          seconds={timerState.seconds}
          exerciseName={currentWorkout.exercicios[timerState.exerciseIndex].nome}
          setNumber={timerState.setNumber}
          totalSets={currentWorkout.exercicios[timerState.exerciseIndex].series}
          onComplete={handleTimerDone}
          onSkip={handleTimerDone}
        />
      )}

      <div className="space-y-6 animate-slide-up">
        {/* ── Header do treino ──────────────────────────────────────────── */}
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
                  {currentWorkout.nome}
                </h2>
              </div>

              {/* Right side: duration badge + Favorite + History buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="bg-orange-500/20 border border-orange-500/40 text-orange-300 text-sm font-semibold px-3 py-1.5 rounded-lg">
                  ⏱ {currentWorkout.duracao_estimada}
                </span>

                {/* Agente 1 — FavoriteButton */}
                {savedWorkout && onToggleFavorite && (
                  <FavoriteButton
                    workoutId={savedWorkout.id}
                    isFavorite={savedWorkout.isFavorite}
                    onToggle={onToggleFavorite}
                  />
                )}

                {/* Agente 1 — History button */}
                {onOpenHistory && (
                  <button
                    onClick={onOpenHistory}
                    aria-label="Abrir histórico"
                    title="Ver histórico de treinos"
                    className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-700 bg-gray-800 text-gray-400 hover:border-orange-500/40 hover:text-orange-400 transition-all duration-200 active:scale-90 text-base"
                  >
                    🕓
                  </button>
                )}
              </div>
            </div>

            <p className="mt-3 text-gray-300 text-sm leading-relaxed">
              {currentWorkout.descricao}
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

        {/* ── Difficulty Adjuster (Agente 3) ──────────────────────────────── */}
        <DifficultyAdjuster
          onAdjust={handleAdjustDifficulty}
          isLoading={difficultyLoading}
          currentLevel={difficultyLevel}
        />

        {/* ── Lista de exercícios ──────────────────────────────────────────── */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest px-1">
            {currentWorkout.exercicios.length} Exercícios
          </h3>

          {currentWorkout.exercicios.map((ex, index) => (
            <div
              key={index}
              className="group rounded-xl border border-gray-800 bg-gray-900 hover:border-orange-500/30 hover:bg-gray-900/80 transition-all duration-200 p-4"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className="flex items-start gap-4">
                {/* Number badge */}
                <div className="shrink-0 w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                  <span className="text-orange-400 text-sm font-bold">
                    {index + 1}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  {/* Exercise name + Replace button (Agente 3) */}
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-white font-semibold text-sm leading-snug">
                      {ex.nome}
                    </h4>
                    <button
                      onClick={() => handleReplaceExercise(index)}
                      disabled={replacingIndex !== null}
                      aria-label={`Substituir ${ex.nome}`}
                      title="Substituir exercício por alternativa equivalente"
                      className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg border border-gray-700 bg-gray-800 text-gray-500 hover:border-orange-500/40 hover:text-orange-400 transition-all duration-200 active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed text-xs"
                    >
                      {replacingIndex === index ? (
                        <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        "🔄"
                      )}
                    </button>
                  </div>

                  {/* Stats badges + Timer button (Agente 3) */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    <StatBadge icon="🔁" label="Séries" value={`${ex.series}x`} accent />
                    <StatBadge icon="💪" label="Reps" value={ex.repeticoes} />
                    {/* Descanso badge doubles as timer trigger */}
                    <button
                      onClick={() => handleStartTimer(index, 1)}
                      title="Iniciar timer de descanso"
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-800 border border-gray-700 text-gray-400 hover:border-orange-500/40 hover:text-orange-300 transition-all duration-150 active:scale-95"
                    >
                      <span>⏸️</span>
                      <span>{ex.descanso}</span>
                    </button>
                  </div>

                  <p className="mt-2.5 text-gray-500 text-xs leading-relaxed border-l-2 border-gray-700 pl-2.5 group-hover:border-orange-500/30 group-hover:text-gray-400 transition-all">
                    💡 {ex.dica}
                  </p>

                  {/* Exercise Tracker */}
                  <ExerciseTracker
                    exerciseIndex={index}
                    totalSets={ex.series}
                    targetReps={ex.repeticoes}
                    descanso={ex.descanso}
                    logs={setLogs[index] ?? []}
                    onAdd={(log) => addLog(index, log)}
                    onClear={() => clearExerciseLogs(index)}
                    onStartTimer={(setNumber) => handleStartTimer(index, setNumber)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Observação final ─────────────────────────────────────────────── */}
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1.5">
            📌 Dica do Personal
          </p>
          <p className="text-gray-300 text-sm leading-relaxed">
            {currentWorkout.observacao_final}
          </p>
        </div>

        {/* ── Avaliação do treino (Agente 3) ──────────────────────────────── */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
            Avalie este treino
          </p>
          <WorkoutRating workoutNome={currentWorkout.nome} />
        </div>

        {/* ── Relatório de desempenho com IA ──────────────────────────────── */}
        <WorkoutReport
          workout={currentWorkout}
          formData={formData}
          logs={setLogs}
        />

        {/* ── Ações: grid 3 colunas (Agente 2 expandiu de 2→3) ──────────── */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={handleCopy}
            className="py-3.5 rounded-xl text-sm font-semibold border border-gray-700 bg-gray-800 hover:border-gray-600 hover:bg-gray-750 text-gray-300 hover:text-white transition-all duration-200 active:scale-[0.98]"
          >
            {copied ? (
              <span className="flex items-center justify-center gap-2 text-green-400">
                <span>✓</span> Copiado!
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span>📋</span> Copiar
              </span>
            )}
          </button>

          <button
            onClick={handleSavePDF}
            disabled={savingPDF}
            className="py-3.5 rounded-xl text-sm font-semibold border border-gray-700 bg-gray-800 hover:border-red-500/40 hover:bg-gray-750 text-gray-300 hover:text-red-400 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {savingPDF ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Salvando...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span>📄</span> PDF
              </span>
            )}
          </button>

          {/* Agente 2 — ShareButton */}
          <ShareButton workout={currentWorkout} formData={formData} />
        </div>

        {/* ── Gerar outro ───────────────────────────────────────────────────── */}
        <button
          onClick={onRegenerate}
          disabled={isLoading}
          className={`w-full py-3.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all duration-200 active:scale-[0.98]
            disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none ${
            formData.advancedMode
              ? "bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-500 hover:to-violet-600 shadow-violet-500/20 hover:shadow-violet-500/40"
              : "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 shadow-orange-500/20 hover:shadow-orange-500/40"
          }`}
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
              <span>{formData.advancedMode ? "🚀" : "⚡"}</span> Gerar Outro
            </span>
          )}
        </button>
      </div>
    </>
  );
}

// ─── StatBadge ───────────────────────────────────────────────────────────────
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
