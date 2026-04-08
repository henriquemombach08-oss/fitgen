"use client";

import { useState } from "react";
import { Workout, WorkoutFormData, SetLog, WorkoutReportData } from "@/types/workout";

type WorkoutLogs = Record<number, SetLog[]>;
type ExercisePhotos = Record<number, string[]>;

interface WorkoutReportProps {
  workout: Workout;
  formData: WorkoutFormData;
  logs: WorkoutLogs;
  exercisePhotos: ExercisePhotos;
}

function countFilledSets(logs: WorkoutLogs): number {
  return Object.values(logs)
    .flat()
    .filter((s) => s.weight || s.reps).length;
}

function countPhotos(photos: ExercisePhotos): number {
  return Object.values(photos).flat().length;
}

export default function WorkoutReport({ workout, formData, logs, exercisePhotos }: WorkoutReportProps) {
  const [report, setReport] = useState<WorkoutReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [photoAnalysis, setPhotoAnalysis] = useState<string | null>(null);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [photoError, setPhotoError] = useState("");

  const filledSets = countFilledSets(logs);
  const hasData = filledSets > 0;
  const totalPhotos = countPhotos(exercisePhotos);
  const hasPhotos = totalPhotos > 0;

  async function handleGenerate() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/workout-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workout, formData, logs }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        setError(json.error ?? "Erro ao gerar relatório.");
        return;
      }
      setReport(json.report);
    } catch {
      setError("Falha na conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAnalyzePhotos() {
    setLoadingPhotos(true);
    setPhotoError("");
    try {
      const entries = workout.exercicios
        .map((ex, i) => ({ exerciseName: ex.nome, photos: exercisePhotos[i] ?? [] }))
        .filter((e) => e.photos.length > 0);

      const res = await fetch("/api/photo-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries, level: formData.level }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        setPhotoError(json.error ?? "Erro ao analisar fotos.");
        return;
      }
      setPhotoAnalysis(json.analysis);
    } catch {
      setPhotoError("Falha na conexão. Tente novamente.");
    } finally {
      setLoadingPhotos(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 p-4">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
            Relatório de Desempenho
          </p>
          {!hasData && (
            <p className="text-xs text-gray-600 mt-0.5">
              Preencha as séries para liberar a análise
            </p>
          )}
          {hasData && !report && (
            <p className="text-xs text-gray-600 mt-0.5">
              {filledSets} série{filledSets > 1 ? "s" : ""} registrada{filledSets > 1 ? "s" : ""} — pronto para análise
            </p>
          )}
        </div>

        {!report && (
          <button
            onClick={handleGenerate}
            disabled={!hasData || loading}
            className="shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95
              disabled:opacity-40 disabled:cursor-not-allowed
              bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-500 hover:to-violet-600
              text-white shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30
              disabled:bg-none disabled:bg-gray-800 disabled:shadow-none disabled:text-gray-500 disabled:border disabled:border-gray-700"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Analisando...
              </>
            ) : (
              <>
                <span>🤖</span>
                Analisar com IA
              </>
            )}
          </button>
        )}

        {report && (
          <button
            onClick={() => { setReport(null); setError(""); }}
            className="shrink-0 text-xs text-gray-600 hover:text-gray-400 transition-colors"
          >
            Gerar novamente
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mb-4 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {/* Report content */}
      {report && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-800 pt-4">
          {/* Resumo */}
          <p className="text-gray-300 text-sm leading-relaxed">{report.resumo}</p>

          {/* Destaques */}
          <div>
            <p className="text-xs font-semibold text-green-400 uppercase tracking-widest mb-2">
              ✅ Pontos positivos
            </p>
            <ul className="space-y-1.5">
              {report.destaques.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-gray-300 leading-relaxed">
                  <span className="mt-0.5 shrink-0 w-4 h-4 rounded-full bg-green-500/15 border border-green-500/25 flex items-center justify-center text-green-400 font-bold text-[10px]">
                    {i + 1}
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Melhorias */}
          <div>
            <p className="text-xs font-semibold text-orange-400 uppercase tracking-widest mb-2">
              📈 Pontos de melhora
            </p>
            <ul className="space-y-1.5">
              {report.melhorias.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-gray-300 leading-relaxed">
                  <span className="mt-0.5 shrink-0 w-4 h-4 rounded-full bg-orange-500/15 border border-orange-500/25 flex items-center justify-center text-orange-400 font-bold text-[10px]">
                    {i + 1}
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Dica principal */}
          <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 px-3.5 py-3">
            <p className="text-xs font-semibold text-violet-400 uppercase tracking-widest mb-1">
              🎯 Dica para o próximo treino
            </p>
            <p className="text-sm text-gray-300 leading-relaxed">{report.dica_principal}</p>
          </div>
        </div>
      )}

      {/* ── Análise de fotos ─────────────────────────────────────────────── */}
      {hasPhotos && (
        <div className="border-t border-gray-800">
          <div className="flex items-center justify-between gap-3 p-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                Análise Visual
              </p>
              <p className="text-xs text-gray-600 mt-0.5">
                {totalPhotos} foto{totalPhotos > 1 ? "s" : ""} — IA avalia sua execução
              </p>
            </div>

            {!photoAnalysis && (
              <button
                onClick={handleAnalyzePhotos}
                disabled={loadingPhotos}
                className="shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95
                  disabled:opacity-40 disabled:cursor-not-allowed
                  bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600
                  text-white shadow-lg shadow-blue-500/20"
              >
                {loadingPhotos ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Analisando...
                  </>
                ) : (
                  <><span>📸</span> Analisar fotos</>
                )}
              </button>
            )}

            {photoAnalysis && (
              <button
                onClick={() => { setPhotoAnalysis(null); setPhotoError(""); }}
                className="shrink-0 text-xs text-gray-600 hover:text-gray-400 transition-colors"
              >
                Reanalisar
              </button>
            )}
          </div>

          {photoError && (
            <div className="mx-4 mb-4 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-xs text-red-400">{photoError}</p>
            </div>
          )}

          {photoAnalysis && (
            <div className="px-4 pb-4 border-t border-gray-800 pt-4">
              <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-2">
                🔍 Avaliação da execução
              </p>
              <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                {photoAnalysis}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
