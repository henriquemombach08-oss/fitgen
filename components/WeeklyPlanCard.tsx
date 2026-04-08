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
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="w-8 h-8 flex items-center justify-center transition-all duration-150"
        style={{
          background: "#141414",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "8px",
          color: "#a1a1aa",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.10)";
          (e.currentTarget as HTMLButtonElement).style.color = "#fafafa";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.06)";
          (e.currentTarget as HTMLButtonElement).style.color = "#a1a1aa";
        }}
        aria-label="Plano Semanal"
        title="Plano Semanal"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => setOpen(false)}
          />

          {/* Modal card */}
          <div
            className="relative max-w-lg w-full mx-4 rounded-2xl shadow-2xl max-h-[88vh] flex flex-col"
            style={{
              background: "#0f0f0f",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4 shrink-0"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
              <h2 className="text-sm font-semibold" style={{ color: "#fafafa" }}>
                Plano Semanal
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 flex items-center justify-center text-xs transition-colors"
                style={{
                  background: "#141414",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "6px",
                  color: "#a1a1aa",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.10)";
                  (e.currentTarget as HTMLButtonElement).style.color = "#fafafa";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.06)";
                  (e.currentTarget as HTMLButtonElement).style.color = "#a1a1aa";
                }}
                aria-label="Fechar"
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div
              className="px-5 py-4 flex-1"
              style={{ overflowY: "auto", scrollbarWidth: "none" }}
            >
              {/* Loading */}
              {loading && (
                <div className="flex items-center justify-center py-16">
                  <div
                    className="w-5 h-5 rounded-full animate-spin"
                    style={{
                      border: "2px solid rgba(255,255,255,0.08)",
                      borderTopColor: "#f97316",
                    }}
                  />
                </div>
              )}

              {/* Error */}
              {!loading && error && (
                <div
                  className="rounded-xl p-4 text-center mb-4"
                  style={{
                    border: "1px solid rgba(239,68,68,0.20)",
                    background: "rgba(239,68,68,0.05)",
                  }}
                >
                  <p className="text-sm font-semibold" style={{ color: "#f87171" }}>
                    Algo deu errado
                  </p>
                  <p className="text-xs mt-1" style={{ color: "#52525b" }}>
                    {error}
                  </p>
                  <button
                    onClick={handleReset}
                    className="mt-3 text-xs underline transition-colors"
                    style={{ color: "#a1a1aa" }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.color = "#fafafa";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.color = "#a1a1aa";
                    }}
                  >
                    Tentar novamente
                  </button>
                </div>
              )}

              {/* No plan yet — selector + generate button */}
              {!loading && !error && !plan && (
                <div className="space-y-5">
                  <div>
                    <p className="text-sm mb-3" style={{ color: "#a1a1aa" }}>
                      Quantos dias por semana você quer treinar?
                    </p>
                    <div className="flex gap-2">
                      {[3, 4, 5, 6].map((d) => (
                        <button
                          key={d}
                          onClick={() => setDaysPerWeek(d)}
                          className="flex-1 py-2 text-sm font-semibold rounded-lg transition-colors"
                          style={
                            daysPerWeek === d
                              ? {
                                  background: "rgba(249,115,22,0.12)",
                                  border: "1px solid rgba(249,115,22,0.30)",
                                  color: "#f97316",
                                }
                              : {
                                  background: "#141414",
                                  border: "1px solid rgba(255,255,255,0.06)",
                                  color: "#a1a1aa",
                                }
                          }
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={generatePlan}
                    className="w-full py-3 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90 active:opacity-80"
                    style={{ background: "#f97316" }}
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
                    <h3 className="text-base font-bold" style={{ color: "#fafafa" }}>
                      {plan.nome}
                    </h3>
                    <p className="text-sm mt-1" style={{ color: "#a1a1aa" }}>
                      {plan.descricao}
                    </p>
                  </div>

                  {/* 7-day list */}
                  <div className="space-y-2">
                    {plan.dias.map((day, i) => {
                      const isRest = day.tipo === "Rest";
                      return (
                        <div
                          key={i}
                          className="rounded-xl px-4 py-3"
                          style={
                            isRest
                              ? {
                                  background: "#141414",
                                  border: "1px solid rgba(255,255,255,0.06)",
                                }
                              : {
                                  background: "#141414",
                                  border: "1px solid rgba(255,255,255,0.06)",
                                  borderLeft: "2px solid rgba(249,115,22,0.50)",
                                }
                          }
                        >
                          <div className="flex items-start justify-between gap-3">
                            {/* Left: day name + badge */}
                            <div className="shrink-0">
                              <p
                                className="text-sm font-bold"
                                style={{ color: isRest ? "#52525b" : "#fafafa" }}
                              >
                                {day.dia}
                              </p>
                              <span
                                className="text-xs font-medium px-2 py-0.5 rounded mt-1 inline-block"
                                style={
                                  isRest
                                    ? {
                                        background: "#0f0f0f",
                                        color: "#52525b",
                                      }
                                    : {
                                        background: "rgba(249,115,22,0.08)",
                                        color: "#f97316",
                                      }
                                }
                              >
                                {day.tipo}
                              </span>
                            </div>

                            {/* Right: foco + muscle tags */}
                            <div className="flex-1 min-w-0">
                              <p
                                className="text-sm font-semibold"
                                style={{ color: isRest ? "#52525b" : "#a1a1aa" }}
                              >
                                {day.foco}
                              </p>
                              {day.musculosprincipais.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {day.musculosprincipais.map((m, j) => (
                                    <span
                                      key={j}
                                      className="text-xs px-1.5 py-0.5 rounded"
                                      style={{
                                        background: "#0f0f0f",
                                        color: "#52525b",
                                      }}
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
                            <p className="text-xs mt-2" style={{ color: "#52525b" }}>
                              {day.observacao}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* General tip */}
                  {plan.dica_geral && (
                    <div
                      className="rounded-xl px-4 py-3"
                      style={{
                        background: "rgba(249,115,22,0.05)",
                        border: "1px solid rgba(249,115,22,0.15)",
                      }}
                    >
                      <p className="text-xs font-semibold mb-1" style={{ color: "#f97316" }}>
                        Dica Geral
                      </p>
                      <p className="text-sm" style={{ color: "#a1a1aa" }}>
                        {plan.dica_geral}
                      </p>
                    </div>
                  )}

                  {/* Regenerate button */}
                  <button
                    onClick={handleReset}
                    className="w-full text-xs py-2 transition-colors"
                    style={{ color: "#52525b" }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.color = "#a1a1aa";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.color = "#52525b";
                    }}
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
