"use client";

import { useState, useCallback } from "react";
import { Workout, WorkoutFormData, Exercise, SavedWorkout } from "@/types/workout";
import ShareButton from "@/components/ShareButton";
import FavoriteButton from "@/components/FavoriteButton";
import WorkoutRating from "@/components/WorkoutRating";
import RestTimer from "@/components/RestTimer";
import DifficultyAdjuster from "@/components/DifficultyAdjuster";
import ExerciseTracker from "@/components/ExerciseTracker";
import ExerciseGif from "@/components/ExerciseGif";
import WorkoutReport from "@/components/WorkoutReport";
import WorkoutMode from "@/components/WorkoutMode";
import { parseRestTime } from "@/utils/parseRestTime";
import { useSetLogs } from "@/hooks/useSetLogs";
import { useLoadProgression } from "@/hooks/useLoadProgression";

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

  // ── State: Modo Treino
  const [workoutModeOpen, setWorkoutModeOpen] = useState(false);

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

  // ── Load progression
  const exerciseNames = currentWorkout.exercicios.map((e) => e.nome);
  const { previousLogs } = useLoadProgression(exerciseNames);

  // ── Exercise photos (in-memory per exercise index)
  const [exercisePhotos, setExercisePhotos] = useState<Record<number, string[]>>({});

  function handleAddPhoto(exerciseIndex: number, dataUrl: string) {
    setExercisePhotos((prev) => ({
      ...prev,
      [exerciseIndex]: [...(prev[exerciseIndex] ?? []), dataUrl],
    }));
  }

  function handleRemovePhoto(exerciseIndex: number, photoIndex: number) {
    setExercisePhotos((prev) => {
      const photos = [...(prev[exerciseIndex] ?? [])];
      photos.splice(photoIndex, 1);
      return { ...prev, [exerciseIndex]: photos };
    });
  }

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

      <div className="space-y-5 animate-slide-up">
        {/* ── Header do treino ──────────────────────────────────────────── */}
        <div className="rounded-2xl p-5" style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-medium tracking-wide" style={{ color: '#f97316' }}>
                  {currentWorkout.duracao_estimada}
                </span>
                {formData.advancedMode && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ background: 'rgba(139,92,246,0.10)', border: '1px solid rgba(139,92,246,0.20)', color: '#a78bfa' }}>
                    Avançado
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold leading-tight" style={{ color: '#fafafa' }}>
                {currentWorkout.nome}
              </h2>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setWorkoutModeOpen(true)}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.20)', color: '#f97316' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                Iniciar
              </button>
              {savedWorkout && onToggleFavorite && (
                <FavoriteButton workoutId={savedWorkout.id} isFavorite={savedWorkout.isFavorite} onToggle={onToggleFavorite} />
              )}
              {onOpenHistory && (
                <button
                  onClick={onOpenHistory}
                  aria-label="Histórico"
                  className="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
                  style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)', color: '#52525b' }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                </button>
              )}
            </div>
          </div>

          <p className="text-sm leading-relaxed mb-4" style={{ color: '#a1a1aa' }}>
            {currentWorkout.descricao}
          </p>

          <div className="flex flex-wrap gap-1.5">
            {[...formData.muscleGroups, ...formData.goals, formData.level, formData.equipment].map((tag) => (
              <span key={tag} className="text-xs px-2 py-0.5 rounded-md" style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)', color: '#52525b' }}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* ── Difficulty Adjuster ──────────────────────────────────────────── */}
        <DifficultyAdjuster onAdjust={handleAdjustDifficulty} isLoading={difficultyLoading} currentLevel={difficultyLevel} />

        {/* ── Lista de exercícios ──────────────────────────────────────────── */}
        <div className="space-y-2">
          <p className="text-xs font-medium tracking-wide px-1" style={{ color: '#52525b' }}>
            {currentWorkout.exercicios.length} exercícios
          </p>

          {currentWorkout.exercicios.map((ex, index) => (
            <div
              key={index}
              className="group rounded-xl p-4 transition-all duration-200"
              style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-start gap-3">
                {/* Number */}
                <div className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: '#141414', color: '#f97316' }}>
                  {index + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {ex.en_name && <ExerciseGif enName={ex.en_name} />}
                      <h4 className="font-semibold text-sm leading-snug" style={{ color: '#fafafa' }}>
                        {ex.nome}
                      </h4>
                    </div>
                    <button
                      onClick={() => handleReplaceExercise(index)}
                      disabled={replacingIndex !== null}
                      aria-label={`Substituir ${ex.nome}`}
                      className="shrink-0 w-6 h-6 flex items-center justify-center rounded-md transition-all disabled:opacity-30"
                      style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)', color: '#52525b' }}
                    >
                      {replacingIndex === index ? (
                        <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="1 4 1 10 7 10"/><polyline points="23 20 23 14 17 14"/>
                          <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                        </svg>
                      )}
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-2.5">
                    <span className="text-xs px-2 py-1 rounded-md font-semibold" style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.15)', color: '#f97316' }}>
                      {ex.series} séries
                    </span>
                    <span className="text-xs px-2 py-1 rounded-md" style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)', color: '#a1a1aa' }}>
                      {ex.repeticoes} reps
                    </span>
                    <button
                      onClick={() => handleStartTimer(index, 1)}
                      title="Iniciar timer"
                      className="text-xs px-2 py-1 rounded-md transition-all flex items-center gap-1"
                      style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)', color: '#a1a1aa' }}
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                      </svg>
                      {ex.descanso}
                    </button>
                  </div>

                  <p className="text-xs leading-relaxed pl-2.5" style={{ borderLeft: '2px solid rgba(255,255,255,0.06)', color: '#52525b' }}>
                    {ex.dica}
                  </p>

                  <ExerciseTracker
                    exerciseIndex={index}
                    totalSets={ex.series}
                    targetReps={ex.repeticoes}
                    descanso={ex.descanso}
                    logs={setLogs[index] ?? []}
                    photos={exercisePhotos[index] ?? []}
                    onAdd={(log) => addLog(index, log)}
                    onClear={() => clearExerciseLogs(index)}
                    onAddPhoto={(url) => handleAddPhoto(index, url)}
                    onRemovePhoto={(i) => handleRemovePhoto(index, i)}
                    onStartTimer={(setNumber) => handleStartTimer(index, setNumber)}
                    previousLogs={previousLogs[ex.nome]}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Observação final ─────────────────────────────────────────────── */}
        <div className="rounded-xl p-4" style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-xs font-medium tracking-wide mb-2" style={{ color: '#52525b' }}>
            Nota do Personal
          </p>
          <p className="text-sm leading-relaxed" style={{ color: '#a1a1aa' }}>
            {currentWorkout.observacao_final}
          </p>
        </div>

        {/* ── Avaliação ──────────────────────────────────────────────────────── */}
        <div className="rounded-xl p-4" style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-xs font-medium tracking-wide mb-3" style={{ color: '#52525b' }}>
            Avalie este treino
          </p>
          <WorkoutRating workoutNome={currentWorkout.nome} />
        </div>

        {/* ── Relatório ───────────────────────────────────────────────────── */}
        <WorkoutReport workout={currentWorkout} formData={formData} logs={setLogs} exercisePhotos={exercisePhotos} />

        {/* ── Ações ───────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={handleCopy}
            className="py-3 rounded-xl text-sm font-medium transition-all"
            style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)', color: copied ? '#4ade80' : '#a1a1aa' }}
          >
            {copied ? "Copiado" : "Copiar"}
          </button>
          <button
            onClick={handleSavePDF}
            disabled={savingPDF}
            className="py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
            style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)', color: '#a1a1aa' }}
          >
            {savingPDF ? "..." : "PDF"}
          </button>
          <ShareButton workout={currentWorkout} formData={formData} />
        </div>

        {/* ── Gerar outro ───────────────────────────────────────────────── */}
        <button
          onClick={onRegenerate}
          disabled={isLoading}
          className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40"
          style={{ background: formData.advancedMode ? '#7c3aed' : '#f97316' }}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Gerando...
            </span>
          ) : "Gerar outro treino"}
        </button>
      </div>

      {workoutModeOpen && (
        <WorkoutMode workout={currentWorkout} onClose={() => setWorkoutModeOpen(false)} />
      )}
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
