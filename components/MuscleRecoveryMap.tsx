"use client";

import { useState, useMemo } from "react";
import { useWorkoutHistory } from "@/hooks/useWorkoutHistory";
import { SavedWorkout } from "@/types/workout";

// ─── Constants ────────────────────────────────────────────────────────────────

const TRACKED_GROUPS = [
  "Peito",
  "Costas",
  "Pernas",
  "Ombros",
  "Bíceps",
  "Tríceps",
  "Quadríceps",
  "Posterior",
  "Glúteos",
  "Core / Abdômen",
  "Panturrilha",
] as const;

type TrackedGroup = (typeof TRACKED_GROUPS)[number];

const groupExpansion: Record<string, string[]> = {
  "Full Body": [
    "Peito",
    "Costas",
    "Pernas",
    "Ombros",
    "Bíceps",
    "Tríceps",
    "Quadríceps",
    "Posterior",
    "Glúteos",
    "Core / Abdômen",
  ],
  "Upper Body": ["Peito", "Costas", "Ombros", "Bíceps", "Tríceps"],
  "Push (Peito + Ombro + Tríceps)": ["Peito", "Ombros", "Tríceps"],
  "Pull (Costas + Bíceps)": ["Costas", "Bíceps"],
  "Braços": ["Bíceps", "Tríceps"],
  "Pernas": ["Quadríceps", "Posterior", "Glúteos", "Panturrilha"],
};

// ─── Types ────────────────────────────────────────────────────────────────────

type RecoveryStatus = "recuperando" | "parcial" | "pronto" | "descansado";

interface MuscleStatus {
  group: TrackedGroup;
  status: RecoveryStatus;
  hoursElapsed: number | null;
  lastWorkout: Date | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStatusFromHours(hours: number | null): RecoveryStatus {
  if (hours === null) return "descansado";
  if (hours < 24) return "recuperando";
  if (hours < 48) return "parcial";
  if (hours < 72) return "pronto";
  return "descansado";
}

const statusConfig: Record<
  RecoveryStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  recuperando: {
    label: "Recuperando",
    color: "#f87171",
    bg: "rgba(248,113,113,0.05)",
    border: "rgba(248,113,113,0.15)",
  },
  parcial: {
    label: "Parcial",
    color: "#eab308",
    bg: "rgba(234,179,8,0.05)",
    border: "rgba(234,179,8,0.15)",
  },
  pronto: {
    label: "Pronto",
    color: "#10b981",
    bg: "rgba(16,185,129,0.05)",
    border: "rgba(16,185,129,0.15)",
  },
  descansado: {
    label: "Descansado",
    color: "#52525b",
    bg: "rgba(82,82,91,0.05)",
    border: "rgba(82,82,91,0.15)",
  },
};

function expandMuscleGroups(groups: string[]): string[] {
  const result = new Set<string>();
  for (const g of groups) {
    if (groupExpansion[g]) {
      for (const sub of groupExpansion[g]) result.add(sub);
    } else {
      result.add(g);
    }
  }
  return [...result];
}

function formatRelativeTime(hours: number): string {
  if (hours < 1) return "há menos de 1h";
  if (hours < 24) return `há ${Math.floor(hours)}h`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "há 1 dia" : `há ${days} dias`;
}

function computeMuscleStatuses(history: SavedWorkout[]): MuscleStatus[] {
  const now = Date.now();

  // Build a map: trackedGroup → most recent workout date
  const latestWorkoutMs: Partial<Record<TrackedGroup, number>> = {};

  for (const entry of history) {
    const trainedDate = new Date(entry.createdAt).getTime();
    const rawGroups = entry.formData.muscleGroups ?? [];
    const expanded = expandMuscleGroups(rawGroups as string[]);

    for (const g of expanded) {
      if (TRACKED_GROUPS.includes(g as TrackedGroup)) {
        const key = g as TrackedGroup;
        if (latestWorkoutMs[key] === undefined || trainedDate > latestWorkoutMs[key]!) {
          latestWorkoutMs[key] = trainedDate;
        }
      }
    }
  }

  return TRACKED_GROUPS.map((group) => {
    const lastMs = latestWorkoutMs[group] ?? null;
    const hoursElapsed = lastMs !== null ? (now - lastMs) / 3_600_000 : null;
    const status = getStatusFromHours(hoursElapsed);
    return {
      group,
      status,
      hoursElapsed,
      lastWorkout: lastMs !== null ? new Date(lastMs) : null,
    };
  });
}

function getLastWorkoutRelative(history: SavedWorkout[]): string | null {
  if (!history.length) return null;
  const latest = history[0];
  const hours = (Date.now() - new Date(latest.createdAt).getTime()) / 3_600_000;
  return formatRelativeTime(hours);
}

function getRecoveryTip(statuses: MuscleStatus[]): string {
  const recuperando = statuses.filter((s) => s.status === "recuperando").length;
  const parcial = statuses.filter((s) => s.status === "parcial").length;
  const pronto = statuses.filter((s) => s.status === "pronto").length;
  const descansado = statuses.filter((s) => s.status === "descansado").length;

  const total = statuses.length;

  if (descansado === total) {
    return "Você está completamente recuperado. Hora de treinar!";
  }
  if (recuperando + parcial > total / 2) {
    return "Considere um dia de descanso ativo ou cardio leve";
  }
  if (pronto + descansado > total / 2) {
    return "Ótimo momento para um treino intenso!";
  }
  return "Alguns grupos estão prontos — escolha-os para o próximo treino.";
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MuscleRecoveryMap() {
  const [open, setOpen] = useState(false);
  const { history, loading } = useWorkoutHistory();

  const { statuses, readyCount, recoveringCount, lastWorkoutLabel, tip } = useMemo(() => {
    const statuses = computeMuscleStatuses(history);
    const readyCount = statuses.filter(
      (s) => s.status === "pronto" || s.status === "descansado"
    ).length;
    const recoveringCount = statuses.filter(
      (s) => s.status === "recuperando" || s.status === "parcial"
    ).length;
    const lastWorkoutLabel = getLastWorkoutRelative(history);
    const tip = getRecoveryTip(statuses);
    return { statuses, readyCount, recoveringCount, lastWorkoutLabel, tip };
  }, [history]);

  const isEmpty = !loading && history.length === 0;

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Mapa de recuperação muscular"
        title="Mapa de recuperação muscular"
        className="w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-150 active:scale-90"
        style={{
          background: "#141414",
          border: "1px solid rgba(255,255,255,0.06)",
          color: "#a1a1aa",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor =
            "rgba(249,115,22,0.3)";
          (e.currentTarget as HTMLButtonElement).style.color = "#f97316";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor =
            "rgba(255,255,255,0.06)";
          (e.currentTarget as HTMLButtonElement).style.color = "#a1a1aa";
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="5" r="2" />
          <path d="M12 7v8" />
          <path d="M8 10h8" />
          <path d="M9 21l3-4 3 4" />
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
            className="relative w-full max-w-sm rounded-2xl shadow-2xl flex flex-col overflow-y-auto"
            style={{
              background: "#0f0f0f",
              border: "1px solid rgba(255,255,255,0.06)",
              maxHeight: "80vh",
            }}
          >
            {/* Top accent line */}
            <div
              style={{
                height: "1px",
                background: "rgba(249,115,22,0.40)",
                flexShrink: 0,
              }}
            />

            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                flexShrink: 0,
              }}
            >
              <div>
                <h2
                  className="font-semibold text-sm"
                  style={{ color: "#fafafa" }}
                >
                  Mapa de Recuperação
                </h2>
                <p className="text-xs mt-0.5" style={{ color: "#71717a" }}>
                  Baseado nos seus últimos treinos
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  color: "#71717a",
                }}
                aria-label="Fechar"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex flex-col gap-4 px-5 py-4">
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <p className="text-xs" style={{ color: "#52525b" }}>
                    Carregando...
                  </p>
                </div>
              ) : isEmpty ? (
                /* Empty state */
                <div
                  className="rounded-xl px-4 py-8 text-center"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <p className="text-xs leading-relaxed" style={{ color: "#52525b" }}>
                    Gere e complete treinos para ver seu mapa de recuperação.
                  </p>
                </div>
              ) : (
                <>
                  {/* Summary row */}
                  <div className="grid grid-cols-3 gap-2">
                    <div
                      className="rounded-xl px-3 py-3 text-center"
                      style={{
                        background: "rgba(16,185,129,0.05)",
                        border: "1px solid rgba(16,185,129,0.15)",
                      }}
                    >
                      <p
                        className="text-lg font-bold leading-none"
                        style={{ color: "#10b981" }}
                      >
                        {readyCount}
                      </p>
                      <p
                        className="text-xs mt-1 leading-tight"
                        style={{ color: "#52525b" }}
                      >
                        Grupos prontos
                      </p>
                    </div>

                    <div
                      className="rounded-xl px-3 py-3 text-center"
                      style={{
                        background: "rgba(248,113,113,0.05)",
                        border: "1px solid rgba(248,113,113,0.15)",
                      }}
                    >
                      <p
                        className="text-lg font-bold leading-none"
                        style={{ color: "#f87171" }}
                      >
                        {recoveringCount}
                      </p>
                      <p
                        className="text-xs mt-1 leading-tight"
                        style={{ color: "#52525b" }}
                      >
                        Recuperando
                      </p>
                    </div>

                    <div
                      className="rounded-xl px-3 py-3 text-center"
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <p
                        className="text-xs font-semibold leading-snug"
                        style={{ color: "#a1a1aa" }}
                      >
                        {lastWorkoutLabel ?? "—"}
                      </p>
                      <p
                        className="text-xs mt-1 leading-tight"
                        style={{ color: "#52525b" }}
                      >
                        Último treino
                      </p>
                    </div>
                  </div>

                  {/* Muscle group grid */}
                  <div className="grid grid-cols-2 gap-2">
                    {statuses.map(({ group, status, hoursElapsed }) => {
                      const cfg = statusConfig[status];
                      return (
                        <div
                          key={group}
                          className="rounded-xl px-3 py-2.5 flex items-start gap-2.5"
                          style={{
                            background: cfg.bg,
                            border: `1px solid ${cfg.border}`,
                          }}
                        >
                          {/* Color dot */}
                          <div
                            className="mt-0.5 flex-shrink-0 rounded-full"
                            style={{
                              width: 8,
                              height: 8,
                              background: cfg.color,
                              marginTop: 4,
                            }}
                          />
                          <div className="min-w-0">
                            <p
                              className="text-xs font-medium leading-tight truncate"
                              style={{ color: "#e4e4e7" }}
                            >
                              {group}
                            </p>
                            <p
                              className="text-xs mt-0.5 leading-tight"
                              style={{ color: cfg.color, opacity: 0.9 }}
                            >
                              {cfg.label}
                              {hoursElapsed !== null && (
                                <span
                                  style={{
                                    color: "#52525b",
                                    marginLeft: 4,
                                  }}
                                >
                                  · {formatRelativeTime(hoursElapsed)}
                                </span>
                              )}
                              {hoursElapsed === null && (
                                <span
                                  style={{
                                    color: "#52525b",
                                    marginLeft: 4,
                                  }}
                                >
                                  · nunca treinado
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Recovery tip */}
                  <div
                    className="rounded-xl px-4 py-3"
                    style={{
                      background: "rgba(249,115,22,0.05)",
                      border: "1px solid rgba(249,115,22,0.12)",
                    }}
                  >
                    <p
                      className="text-xs font-medium mb-0.5"
                      style={{ color: "#f97316" }}
                    >
                      Dica de recuperação
                    </p>
                    <p className="text-xs leading-relaxed" style={{ color: "#a1a1aa" }}>
                      {tip}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
