"use client";

import { useState } from "react";
import WorkoutForm from "@/components/WorkoutForm";
import WorkoutResult from "@/components/WorkoutResult";
import WorkoutHistory from "@/components/WorkoutHistory";
import LoadingState from "@/components/LoadingState";
import AuthButton from "@/components/AuthButton";
import PersonalChat from "@/components/PersonalChat";
import WeeklyPlanCard from "@/components/WeeklyPlanCard";
import { WorkoutFormData, Workout, GenerateResponse, SavedWorkout } from "@/types/workout";
import { useWorkoutHistory } from "@/hooks/useWorkoutHistory";

type AppState = "idle" | "loading" | "result" | "error";

export default function Home() {
  const [appState, setAppState] = useState<AppState>("idle");
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [lastFormData, setLastFormData] = useState<WorkoutFormData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Agente 1 — Histórico
  const { saveWorkout, toggleFavorite } = useWorkoutHistory();
  const [currentSaved, setCurrentSaved] = useState<SavedWorkout | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  async function generateWorkout(data: WorkoutFormData) {
    setAppState("loading");
    setLastFormData(data);
    setErrorMsg("");
    setCurrentSaved(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json: GenerateResponse = await res.json();

      if (!res.ok || json.error) {
        setErrorMsg(json.error ?? "Erro desconhecido. Tente novamente.");
        setAppState("error");
        return;
      }

      const generatedWorkout = json.workout!;
      setWorkout(generatedWorkout);
      setAppState("result");

      // Salvar automaticamente no histórico após gerar
      const saved = saveWorkout(generatedWorkout, data);
      setCurrentSaved(saved);
    } catch {
      setErrorMsg("Falha na conexão. Verifique sua internet e tente novamente.");
      setAppState("error");
    }
  }

  function handleRegenerate() {
    if (lastFormData) {
      generateWorkout(lastFormData);
    }
  }

  function handleReset() {
    setAppState("idle");
    setWorkout(null);
    setErrorMsg("");
    setCurrentSaved(null);
  }

  // Agente 1 — Carregar treino do histórico
  function handleLoadFromHistory(saved: SavedWorkout) {
    setWorkout(saved.workout);
    setLastFormData(saved.formData);
    setCurrentSaved(saved);
    setAppState("result");
  }

  // Agente 1 — Toggle favorito do treino atual
  function handleToggleFavorite() {
    if (!currentSaved) return;
    toggleFavorite(currentSaved.id);
    setCurrentSaved((prev) =>
      prev ? { ...prev, isFavorite: !prev.isFavorite } : prev
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Grid de fundo decorativo */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#f97316 1px, transparent 1px), linear-gradient(90deg, #f97316 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />

      {/* Glow de fundo */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Agente 1 — WorkoutHistory drawer */}
      <WorkoutHistory
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onLoad={handleLoadFromHistory}
      />

      <div className="relative max-w-lg mx-auto px-4 py-8 pb-16">
        {/* Header */}
        <header className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-1.5 mb-4">
            <span className="text-orange-400 text-xs font-semibold uppercase tracking-widest">
              IA Powered
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
          </div>

          <div className="flex items-center justify-center gap-3">
            <h1 className="text-4xl font-black tracking-tight text-white">
              Fit<span className="text-orange-500">Gen</span>
            </h1>

            {/* Botão histórico */}
            <button
              onClick={() => setIsHistoryOpen(true)}
              aria-label="Abrir histórico de treinos"
              title="Histórico de treinos"
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-700 bg-gray-800 text-gray-400 hover:border-orange-500/40 hover:text-orange-400 transition-all duration-200 active:scale-90 text-base"
            >
              🕓
            </button>

            {/* Plano Semanal */}
            <WeeklyPlanCard userProfile={lastFormData ? { level: lastFormData.level, goals: lastFormData.goals.map(String), equipment: lastFormData.equipment } : undefined} />

            {/* Login Google */}
            <AuthButton />
          </div>

          <p className="mt-2 text-gray-400 text-sm leading-relaxed max-w-xs mx-auto">
            Treinos personalizados gerados por IA em segundos
          </p>
        </header>

        {/* Conteúdo principal */}
        <main>
          {/* Card principal */}
          <div className="rounded-2xl border border-gray-800 bg-gray-950/80 backdrop-blur-sm shadow-2xl overflow-hidden">
            {/* Faixa de acento no topo */}
            <div className="h-1 bg-gradient-to-r from-orange-600 via-orange-400 to-orange-600" />

            <div className="p-6">
              {appState === "idle" && (
                <div className="animate-fade-in">
                  <h2 className="text-lg font-bold text-white mb-1">
                    Configure seu treino
                  </h2>
                  <p className="text-gray-500 text-sm mb-6">
                    Preencha os campos e a IA monta o treino ideal para você.
                  </p>
                  <WorkoutForm onSubmit={generateWorkout} isLoading={false} />
                </div>
              )}

              {appState === "loading" && <LoadingState />}

              {appState === "error" && (
                <div className="animate-fade-in space-y-6">
                  <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5 text-center">
                    <div className="text-4xl mb-3">⚠️</div>
                    <p className="text-red-400 font-semibold text-sm">
                      Algo deu errado
                    </p>
                    <p className="text-gray-500 text-sm mt-1">{errorMsg}</p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleReset}
                      className="flex-1 py-3 rounded-xl text-sm font-semibold border border-gray-700 bg-gray-800 hover:border-gray-600 text-gray-300 hover:text-white transition-all"
                    >
                      ← Voltar
                    </button>
                    <button
                      onClick={handleRegenerate}
                      className="flex-1 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white shadow-lg shadow-orange-500/20 transition-all"
                    >
                      Tentar novamente
                    </button>
                  </div>
                </div>
              )}

              {appState === "result" && workout && lastFormData && (
                <div>
                  {/* Botão voltar ao formulário */}
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 text-gray-500 hover:text-gray-300 text-sm mb-5 transition-colors group"
                  >
                    <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
                    Novo treino
                  </button>

                  <WorkoutResult
                    workout={workout}
                    formData={lastFormData}
                    onRegenerate={handleRegenerate}
                    isLoading={false}
                    savedWorkout={currentSaved}
                    onToggleFavorite={handleToggleFavorite}
                    onOpenHistory={() => setIsHistoryOpen(true)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Rodapé */}
          <p className="text-center text-gray-700 text-xs mt-6">
            Powered by{" "}
            <span className="text-orange-500/60 font-semibold">Groq (Llama 3.3)</span>
            {" · "}
            <span className="text-gray-600">FitGen v1.0</span>
          </p>
        </main>
      </div>
      <PersonalChat userProfile={lastFormData ? { level: lastFormData.level, goals: lastFormData.goals.map(String) } : undefined} />
    </div>
  );
}
