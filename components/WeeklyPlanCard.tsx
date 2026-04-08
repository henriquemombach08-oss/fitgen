"use client";

import { useState } from "react";
import { WeeklyPlan } from "@/types/workout";

interface WeeklyPlanCardProps {
  userProfile?: {
    level: string;
    goals: string[];
    equipment: string;
  };
}

export default function WeeklyPlanCard({ userProfile }: WeeklyPlanCardProps) {
  const [open, setOpen] = useState(false);
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [daysPerWeek, setDaysPerWeek] = useState<number>(4);

  async function generatePlan() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/weekly-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level: userProfile?.level ?? "Intermediário",
          goals: userProfile?.goals ?? ["Hipertrofia"],
          equipment: userProfile?.equipment ?? "Academia completa",
          daysPerWeek,
        }),
      });

      const json = await res.json();

      if (!res.ok || json.error) {
        setError(json.error ?? "Erro desconhecido. Tente novamente.");
      } else {
        setPlan(json.plan);
      }
    } catch {
      setError("Falha na conexão. Verifique sua internet e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setPlan(null);
    setError("");
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300 transition-colors"
      >
        📅 Plano Semanal
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
          />

          {/* Modal card */}
          <div className="relative max-w-lg w-full mx-4 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 shrink-0">
              <h2 className="text-base font-bold text-white">
                📅 Plano Semanal da Semana
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto px-5 py-4 flex-1">
              {/* Loading */}
              {loading && (
                <div className="flex items-center justify-center py-16">
                  <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {/* Error */}
              {!loading && error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-center mb-4">
                  <p className="text-red-400 text-sm font-semibold">Algo deu errado</p>
                  <p className="text-gray-500 text-xs mt-1">{error}</p>
                  <button
                    onClick={handleReset}
                    className="mt-3 text-xs text-gray-400 hover:text-gray-300 underline"
                  >
                    Tentar novamente
                  </button>
                </div>
              )}

              {/* No plan yet — selector + generate button */}
              {!loading && !error && !plan && (
                <div className="space-y-5">
                  <div>
                    <p className="text-sm text-gray-400 mb-3">
                      Quantos dias por semana você quer treinar?
                    </p>
                    <div className="flex gap-2">
                      {[3, 4, 5, 6].map((d) => (
                        <button
                          key={d}
                          onClick={() => setDaysPerWeek(d)}
                          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                            daysPerWeek === d
                              ? "bg-orange-500 text-white"
                              : "bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600 hover:text-gray-300"
                          }`}
                        >
                          {d}x
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={generatePlan}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-3 rounded-xl w-full hover:from-orange-400 hover:to-orange-500 transition-all shadow-lg shadow-orange-500/20"
                  >
                    Gerar Plano
                  </button>
                </div>
              )}

              {/* Plan */}
              {!loading && !error && plan && (
                <div className="space-y-4">
                  {/* Plan name and description */}
                  <div>
                    <h3 className="text-lg font-bold text-white">{plan.nome}</h3>
                    <p className="text-sm text-gray-400 mt-1">{plan.descricao}</p>
                  </div>

                  {/* 7-day list */}
                  <div className="space-y-2">
                    {plan.dias.map((day, i) => {
                      const isRest = day.tipo === "Rest";
                      return (
                        <div
                          key={i}
                          className={`rounded-xl border px-4 py-3 ${
                            isRest
                              ? "border-gray-800 bg-gray-800/30"
                              : "border-orange-500/20 bg-orange-500/5"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            {/* Left: day name + badge */}
                            <div className="shrink-0">
                              <p
                                className={`text-sm font-bold ${
                                  isRest ? "text-gray-500" : "text-white"
                                }`}
                              >
                                {day.dia}
                              </p>
                              <span
                                className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-1 inline-block ${
                                  isRest
                                    ? "bg-gray-700 text-gray-500"
                                    : "bg-orange-500/20 text-orange-400"
                                }`}
                              >
                                {day.tipo}
                              </span>
                            </div>

                            {/* Right: foco + muscle tags */}
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-sm font-semibold ${
                                  isRest ? "text-gray-600" : "text-gray-200"
                                }`}
                              >
                                {day.foco}
                              </p>
                              {day.musculosprincipais.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {day.musculosprincipais.map((m, j) => (
                                    <span
                                      key={j}
                                      className="text-xs px-1.5 py-0.5 rounded bg-gray-800 text-gray-500"
                                    >
                                      {m}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Observation */}
                          {day.observacao && (
                            <p className="text-xs text-gray-600 mt-2">
                              {day.observacao}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* General tip */}
                  {plan.dica_geral && (
                    <div className="bg-violet-500/5 border border-violet-500/20 rounded-xl px-4 py-3">
                      <p className="text-xs font-semibold text-violet-400 mb-1">
                        💡 Dica Geral
                      </p>
                      <p className="text-sm text-violet-300/80">{plan.dica_geral}</p>
                    </div>
                  )}

                  {/* Regenerate button */}
                  <button
                    onClick={handleReset}
                    className="w-full text-xs text-gray-600 hover:text-gray-400 py-2 transition-colors"
                  >
                    Gerar novo plano
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
