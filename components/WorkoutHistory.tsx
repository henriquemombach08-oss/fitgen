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
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden="true"
      />

      {/* Slide-in panel */}
      <aside
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-sm bg-gray-950 border-l border-gray-800 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="Histórico de treinos"
      >
        {/* Top accent bar */}
        <div className="h-1 bg-gradient-to-r from-orange-600 via-orange-400 to-orange-600 shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 shrink-0">
          <div>
            <h2 className="text-white font-bold text-base leading-tight">
              Histórico de Treinos
            </h2>
            <p className="text-gray-500 text-xs mt-0.5">
              {allEntries.length === 0
                ? "Nenhum treino salvo"
                : `${allEntries.length} treino${allEntries.length > 1 ? "s" : ""} salvo${allEntries.length > 1 ? "s" : ""}`}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar histórico"
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-700 bg-gray-800 hover:border-gray-600 hover:bg-gray-700 text-gray-400 hover:text-white transition-all duration-150"
          >
            ✕
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 px-5 py-3 border-b border-gray-800 shrink-0">
          <button
            onClick={() => setActiveTab("all")}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
              activeTab === "all"
                ? "bg-orange-500/20 border border-orange-500/40 text-orange-300"
                : "bg-gray-900 border border-gray-800 text-gray-500 hover:text-gray-300 hover:border-gray-700"
            }`}
          >
            Todos
            {allEntries.length > 0 && (
              <span className="ml-1.5 text-gray-500 font-normal">
                ({allEntries.length})
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("favorites")}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
              activeTab === "favorites"
                ? "bg-orange-500/20 border border-orange-500/40 text-orange-300"
                : "bg-gray-900 border border-gray-800 text-gray-500 hover:text-gray-300 hover:border-gray-700"
            }`}
          >
            ♥ Favoritos
            {favCount > 0 && (
              <span className="ml-1.5 text-gray-500 font-normal">
                ({favCount})
              </span>
            )}
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {displayed.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center px-4">
              {activeTab === "favorites" && allEntries.length > 0 ? (
                <>
                  <span className="text-3xl mb-3">♡</span>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    Nenhum treino favoritado ainda.
                    <br />
                    Toque em ♡ para favoritar um treino.
                  </p>
                </>
              ) : (
                <>
                  <span className="text-3xl mb-3">⚡</span>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    Nenhum treino salvo ainda.
                    <br />
                    Gere seu primeiro treino! ⚡
                  </p>
                </>
              )}
            </div>
          ) : (
            displayed.map((entry) => (
              <div
                key={entry.id}
                className="group rounded-xl border border-gray-800 bg-gray-900 hover:border-orange-500/25 transition-all duration-200 overflow-hidden"
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
                      <span className="text-orange-400 text-sm leading-tight shrink-0 mt-0.5">
                        ♥
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="text-white font-semibold text-sm leading-snug truncate">
                        {entry.workout.nome}
                      </p>
                      <p className="text-gray-500 text-xs mt-0.5 truncate">
                        {entry.formData.muscleGroups.join(" · ")}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    <span className="bg-gray-800 border border-gray-700 text-gray-500 text-xs px-2 py-0.5 rounded">
                      {entry.formData.level}
                    </span>
                    <span className="bg-gray-800 border border-gray-700 text-gray-500 text-xs px-2 py-0.5 rounded">
                      {entry.workout.duracao_estimada}
                    </span>
                    {entry.formData.goals.slice(0, 2).map((goal) => (
                      <span
                        key={goal}
                        className="bg-orange-500/10 border border-orange-500/20 text-orange-400/80 text-xs px-2 py-0.5 rounded"
                      >
                        {goal}
                      </span>
                    ))}
                  </div>

                  <p className="text-gray-600 text-xs mt-2">
                    {formatDate(entry.createdAt)}
                  </p>
                </button>

                {/* Action row */}
                <div className="flex items-center justify-between gap-2 px-4 pb-3">
                  <span className="text-gray-600 text-xs">
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
                      className={`flex items-center justify-center w-9 h-9 rounded-xl border text-sm transition-all duration-200 active:scale-90 ${
                        confirmDeleteId === entry.id
                          ? "border-red-500/50 bg-red-500/15 text-red-400 hover:bg-red-500/25"
                          : "border-gray-700 bg-gray-800 text-gray-500 hover:border-red-500/30 hover:text-red-400"
                      }`}
                    >
                      🗑
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        {allEntries.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-800 shrink-0">
            <p className="text-gray-700 text-xs text-center">
              Máximo de 20 treinos armazenados localmente
            </p>
          </div>
        )}
      </aside>
    </>
  );
}
