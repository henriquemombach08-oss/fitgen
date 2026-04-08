"use client";

import { useState, useMemo } from "react";
import { useWorkoutHistory } from "@/hooks/useWorkoutHistory";
import { SavedWorkout } from "@/types/workout";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getWorkoutTitle(w: SavedWorkout): string {
  if (w.workout.nome && w.workout.nome.trim()) return w.workout.nome;
  const groups = w.formData.muscleGroups;
  if (groups && groups.length > 0) return groups.join(", ");
  return "Treino sem título";
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ProgressStats() {
  const [open, setOpen] = useState(false);
  const { history, loading } = useWorkoutHistory();

  const stats = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Total workouts
    const total = history.length;

    // Workouts this week
    const thisWeek = history.filter((w) => new Date(w.createdAt) >= sevenDaysAgo).length;

    // Muscle group frequency
    const muscleCount: Record<string, number> = {};
    for (const w of history) {
      for (const mg of w.formData.muscleGroups ?? []) {
        muscleCount[mg] = (muscleCount[mg] ?? 0) + 1;
      }
    }
    const sortedMuscles = Object.entries(muscleCount).sort((a, b) => b[1] - a[1]);
    const topMuscle = sortedMuscles[0]?.[0] ?? null;
    const top5Muscles = sortedMuscles.slice(0, 5);
    const maxMuscleCount = top5Muscles[0]?.[1] ?? 1;

    // Activity heatmap — last 30 days
    const thirtyDaysAgo = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
    const activeDays = new Set<string>();
    for (const w of history) {
      const d = startOfDay(new Date(w.createdAt));
      if (d >= startOfDay(thirtyDaysAgo)) {
        activeDays.add(d.toISOString().slice(0, 10));
      }
    }
    const heatmapDays: { date: string; active: boolean }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = startOfDay(d).toISOString().slice(0, 10);
      heatmapDays.push({ date: key, active: activeDays.has(key) });
    }

    // Recent 5 workouts
    const recent = history.slice(0, 5);

    return { total, thisWeek, topMuscle, top5Muscles, maxMuscleCount, heatmapDays, recent };
  }, [history]);

  const isEmpty = !loading && history.length === 0;

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Progresso"
        title="Estatísticas de progresso"
        className="w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-150 active:scale-90"
        style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)", color: "#a1a1aa" }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(249,115,22,0.3)";
          (e.currentTarget as HTMLButtonElement).style.color = "#f97316";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.06)";
          (e.currentTarget as HTMLButtonElement).style.color = "#a1a1aa";
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
          <line x1="2" y1="20" x2="22" y2="20" />
        </svg>
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 backdrop-blur-sm"
            style={{ background: "rgba(0,0,0,0.75)" }}
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div
            className="relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            style={{
              background: "#0f0f0f",
              border: "1px solid rgba(255,255,255,0.06)",
              maxHeight: "88vh",
            }}
          >
            {/* Top accent line */}
            <div style={{ height: "1px", background: "rgba(249,115,22,0.40)", flexShrink: 0 }} />

            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}
            >
              <div>
                <h2 className="font-semibold text-sm" style={{ color: "#fafafa" }}>
                  Progresso
                </h2>
                <p className="text-xs mt-0.5" style={{ color: "#52525b" }}>
                  Resumo dos seus treinos
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Fechar"
                className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
                style={{ color: "#52525b" }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.color = "#fafafa")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.color = "#52525b")
                }
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto px-5 py-5 space-y-6" style={{ flex: 1 }}>
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div
                    className="w-5 h-5 rounded-full border-2 animate-spin"
                    style={{ borderColor: "rgba(249,115,22,0.3)", borderTopColor: "#f97316" }}
                  />
                </div>
              ) : isEmpty ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "#52525b" }}>
                      <line x1="18" y1="20" x2="18" y2="10" />
                      <line x1="12" y1="20" x2="12" y2="4" />
                      <line x1="6" y1="20" x2="6" y2="14" />
                      <line x1="2" y1="20" x2="22" y2="20" />
                    </svg>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "#52525b" }}>
                    Nenhum treino registrado ainda. Gere seu primeiro treino para começar a ver seu progresso.
                  </p>
                </div>
              ) : (
                <>
                  {/* ── 1. Summary cards ─────────────────────────────────── */}
                  <div className="grid grid-cols-3 gap-3">
                    <SummaryCard label="Total de treinos" value={String(stats.total)} />
                    <SummaryCard label="Esta semana" value={String(stats.thisWeek)} />
                    <SummaryCard
                      label="Grupo favorito"
                      value={stats.topMuscle ?? "—"}
                      small={Boolean(stats.topMuscle && stats.topMuscle.length > 8)}
                    />
                  </div>

                  {/* ── 2. Activity heatmap ──────────────────────────────── */}
                  <div>
                    <p
                      className="text-xs font-medium uppercase tracking-wider mb-3"
                      style={{ color: "#52525b" }}
                    >
                      Últimos 30 dias
                    </p>
                    <div
                      className="rounded-xl p-4"
                      style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(15, 1fr)",
                          gap: "4px",
                        }}
                      >
                        {stats.heatmapDays.map((day) => (
                          <div
                            key={day.date}
                            title={day.date}
                            style={{
                              height: "14px",
                              borderRadius: "3px",
                              background: day.active
                                ? "rgba(249,115,22,0.60)"
                                : "rgba(255,255,255,0.04)",
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* ── 3. Muscle group breakdown ────────────────────────── */}
                  {stats.top5Muscles.length > 0 && (
                    <div>
                      <p
                        className="text-xs font-medium uppercase tracking-wider mb-3"
                        style={{ color: "#52525b" }}
                      >
                        Grupos musculares
                      </p>
                      <div
                        className="rounded-xl p-4 space-y-3"
                        style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)" }}
                      >
                        {stats.top5Muscles.map(([muscle, count]) => {
                          const pct = Math.round((count / stats.maxMuscleCount) * 100);
                          return (
                            <div key={muscle}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs" style={{ color: "#a1a1aa" }}>
                                  {muscle}
                                </span>
                                <span className="text-xs font-semibold" style={{ color: "#f97316" }}>
                                  {count}x
                                </span>
                              </div>
                              <div
                                className="h-1.5 rounded-full overflow-hidden"
                                style={{ background: "rgba(255,255,255,0.04)" }}
                              >
                                <div
                                  className="h-full rounded-full"
                                  style={{ width: `${pct}%`, background: "#f97316" }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ── 4. Recent workouts ───────────────────────────────── */}
                  {stats.recent.length > 0 && (
                    <div>
                      <p
                        className="text-xs font-medium uppercase tracking-wider mb-3"
                        style={{ color: "#52525b" }}
                      >
                        Treinos recentes
                      </p>
                      <div
                        className="rounded-xl overflow-hidden"
                        style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)" }}
                      >
                        {stats.recent.map((w, idx) => (
                          <div
                            key={w.id}
                            className="flex items-center gap-3 px-4 py-3"
                            style={{
                              borderTop: idx > 0 ? "1px solid rgba(255,255,255,0.04)" : undefined,
                            }}
                          >
                            {/* Favorite dot */}
                            <div
                              style={{
                                width: "6px",
                                height: "6px",
                                borderRadius: "50%",
                                flexShrink: 0,
                                background: w.isFavorite ? "#f97316" : "rgba(255,255,255,0.08)",
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <p
                                className="text-xs font-medium truncate"
                                style={{ color: "#fafafa" }}
                              >
                                {getWorkoutTitle(w)}
                              </p>
                            </div>
                            <span className="text-xs shrink-0" style={{ color: "#52525b" }}>
                              {formatDate(w.createdAt)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── SummaryCard ──────────────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  small = false,
}: {
  label: string;
  value: string;
  small?: boolean;
}) {
  return (
    <div
      className="rounded-xl p-3 flex flex-col gap-1"
      style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <p
        className={`font-black leading-tight ${small ? "text-sm" : "text-xl"}`}
        style={{ color: "#fafafa" }}
      >
        {value}
      </p>
      <p className="text-xs leading-tight" style={{ color: "#52525b" }}>
        {label}
      </p>
    </div>
  );
}
