"use client";

import { useState, useEffect } from "react";
import { SavedWorkout } from "@/types/workout";
import { useWorkoutHistory } from "@/hooks/useWorkoutHistory";
import FavoriteButton from "@/components/FavoriteButton";

interface WorkoutHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  onLoad: (saved: SavedWorkout) => void;
}

type FilterTab = "all" | "favorites";

function formatDate(isoString: string): string {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
}

export default function WorkoutHistory({
  isOpen,
  onClose,
  onLoad,
}: WorkoutHistoryProps) {
  const { getHistory, toggleFavorite, deleteWorkout } = useWorkoutHistory();
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Reset tab when panel opens
  useEffect(() => {
    if (isOpen) setActiveTab("all");
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const allEntries = getHistory();
  const displayed =
    activeTab === "favorites"
      ? allEntries.filter((e) => e.isFavorite)
      : allEntries;

  const favCount = allEntries.filter((e) => e.isFavorite).length;

  function handleDelete(id: string) {
    if (confirmDeleteId === id) {
      deleteWorkout(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
      // Auto-cancel confirmation after 3 s
      setTimeout(() => setConfirmDeleteId(null), 3000);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/80 backdrop-blur-md transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden="true"
      />

      {/* Slide-in panel */}
      <aside
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-sm flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          background: "#0f0f0f",
          borderLeft: "1px solid rgba(255,255,255,0.06)",
        }}
        aria-label="Histórico de treinos"
      >
        {/* Top accent line */}
        <div className="h-px shrink-0" style={{ background: "rgba(249,115,22,0.30)" }} />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 shrink-0">
          <div>
            <h2 className="font-semibold text-sm leading-tight" style={{ color: "#fafafa" }}>
              Histórico de Treinos
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "#52525b" }}>
              {allEntries.length === 0
                ? "Nenhum treino salvo"
                : `${allEntries.length} treino${allEntries.length > 1 ? "s" : ""} salvo${allEntries.length > 1 ? "s" : ""}`}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar histórico"
            className="w-7 h-7 flex items-center justify-center text-xs transition-all duration-150"
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
          >
            ×
          </button>
        </div>

        {/* Filter tabs — underline style */}
        <div
          className="flex px-5 shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <button
            onClick={() => setActiveTab("all")}
            className="py-2.5 mr-5 text-xs font-medium transition-all duration-150"
            style={{
              color: activeTab === "all" ? "#f97316" : "#52525b",
              borderBottom: activeTab === "all" ? "2px solid #f97316" : "2px solid transparent",
              marginBottom: "-1px",
            }}
          >
            Todos
            {allEntries.length > 0 && (
              <span className="ml-1.5 font-normal" style={{ color: "#52525b" }}>
                ({allEntries.length})
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("favorites")}
            className="py-2.5 text-xs font-medium transition-all duration-150"
            style={{
              color: activeTab === "favorites" ? "#f97316" : "#52525b",
              borderBottom: activeTab === "favorites" ? "2px solid #f97316" : "2px solid transparent",
              marginBottom: "-1px",
            }}
          >
            Favoritos
            {favCount > 0 && (
              <span className="ml-1.5 font-normal" style={{ color: "#52525b" }}>
                ({favCount})
              </span>
            )}
          </button>
        </div>

        {/* List */}
        <div
          className="flex-1 px-4 py-3 space-y-2"
          style={{ overflowY: "auto", scrollbarWidth: "none" }}
        >
          <style>{`
            .history-scroll::-webkit-scrollbar { display: none; }
          `}</style>
          {displayed.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center px-4">
              {activeTab === "favorites" && allEntries.length > 0 ? (
                <p className="text-sm leading-relaxed" style={{ color: "#52525b" }}>
                  Nenhum treino favoritado ainda.
                  <br />
                  Toque em favoritar para salvar um treino.
                </p>
              ) : (
                <p className="text-sm leading-relaxed" style={{ color: "#52525b" }}>
                  Nenhum treino salvo ainda.
                  <br />
                  Gere seu primeiro treino para começar.
                </p>
              )}
            </div>
          ) : (
            displayed.map((entry) => (
              <div
                key={entry.id}
                className="group rounded-xl overflow-hidden transition-all duration-200"
                style={{
                  background: "#141414",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.10)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.06)";
                }}
              >
                {/* Card body — clickable to load */}
                <button
                  onClick={() => {
                    onLoad(entry);
                    onClose();
                  }}
                  className="w-full text-left px-4 pt-4 pb-3 focus:outline-none"
                >
                  <div className="flex items-start gap-2">
                    {entry.isFavorite && (
                      <span
                        className="text-xs leading-tight shrink-0 mt-0.5"
                        style={{ color: "#f97316" }}
                      >
                        ♥
                      </span>
                    )}
                    <div className="min-w-0">
                      <p
                        className="font-semibold text-sm leading-snug truncate"
                        style={{ color: "#fafafa" }}
                      >
                        {entry.workout.nome}
                      </p>
                      <p className="text-xs mt-0.5 truncate" style={{ color: "#52525b" }}>
                        {entry.formData.muscleGroups.join(" · ")}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    <span
                      className="text-xs px-2 py-0.5 rounded"
                      style={{
                        background: "#0f0f0f",
                        border: "1px solid rgba(255,255,255,0.06)",
                        color: "#a1a1aa",
                      }}
                    >
                      {entry.formData.level}
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded"
                      style={{
                        background: "#0f0f0f",
                        border: "1px solid rgba(255,255,255,0.06)",
                        color: "#a1a1aa",
                      }}
                    >
                      {entry.workout.duracao_estimada}
                    </span>
                    {entry.formData.goals.slice(0, 2).map((goal) => (
                      <span
                        key={goal}
                        className="text-xs px-2 py-0.5 rounded"
                        style={{
                          background: "rgba(249,115,22,0.08)",
                          border: "1px solid rgba(249,115,22,0.20)",
                          color: "#f97316",
                        }}
                      >
                        {goal}
                      </span>
                    ))}
                  </div>

                  <p className="text-xs mt-2" style={{ color: "#52525b" }}>
                    {formatDate(entry.createdAt)}
                  </p>
                </button>

                {/* Action row */}
                <div className="flex items-center justify-between gap-2 px-4 pb-3">
                  <span className="text-xs" style={{ color: "#52525b" }}>
                    Clique para carregar
                  </span>
                  <div className="flex items-center gap-2">
                    <FavoriteButton
                      workoutId={entry.id}
                      isFavorite={entry.isFavorite}
                      onToggle={() => toggleFavorite(entry.id)}
                    />
                    <button
                      onClick={() => handleDelete(entry.id)}
                      aria-label={
                        confirmDeleteId === entry.id
                          ? "Confirmar exclusão"
                          : "Deletar treino"
                      }
                      title={
                        confirmDeleteId === entry.id
                          ? "Clique novamente para confirmar"
                          : "Deletar treino"
                      }
                      className="flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 active:scale-90 text-xs"
                      style={
                        confirmDeleteId === entry.id
                          ? {
                              border: "1px solid rgba(239,68,68,0.40)",
                              background: "rgba(239,68,68,0.10)",
                              color: "#f87171",
                            }
                          : {
                              border: "1px solid rgba(255,255,255,0.06)",
                              background: "#0f0f0f",
                              color: "#52525b",
                            }
                      }
                      onMouseEnter={(e) => {
                        if (confirmDeleteId !== entry.id) {
                          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(239,68,68,0.30)";
                          (e.currentTarget as HTMLButtonElement).style.color = "#f87171";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (confirmDeleteId !== entry.id) {
                          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.06)";
                          (e.currentTarget as HTMLButtonElement).style.color = "#52525b";
                        }
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                        <path d="M10 11v6M14 11v6"/>
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        {allEntries.length > 0 && (
          <div
            className="px-5 py-3 shrink-0"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            <p className="text-xs text-center" style={{ color: "#52525b" }}>
              Máximo de 20 treinos armazenados localmente
            </p>
          </div>
        )}
      </aside>
    </>
  );
}
