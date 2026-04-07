"use client";

import { useState } from "react";
import WorkoutForm from "@/components/WorkoutForm";
import WorkoutResult from "@/components/WorkoutResult";
import LoadingState from "@/components/LoadingState";
import { WorkoutFormData, Workout, GenerateResponse } from "@/types/workout";

type AppState = "idle" | "loading" | "result" | "error";

export default function Home() {
  const [appState, setAppState] = useState<AppState>("idle");
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [lastFormData, setLastFormData] = useState<WorkoutFormData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  async function generateWorkout(data: WorkoutFormData) {
    setAppState("loading");
    setLastFormData(data);
    setErrorMsg("");

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

      setWorkout(json.workout!);
      setAppState("result");
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

      <div className="relative max-w-lg mx-auto px-4 py-8 pb-16">
        {/* Header */}
        <header className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-1.5 mb-4">
            <span className="text-orange-400 text-xs font-semibold uppercase tracking-widest">
              IA Powered
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
          </div>

          <h1 className="text-4xl font-black tracking-tight text-white">
            Fit<span className="text-orange-500">Gen</span>
          </h1>
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
    </div>
  );
}
