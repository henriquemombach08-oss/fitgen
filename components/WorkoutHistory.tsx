"use client";

import { useState, useEffect } from "react";
import { SavedWorkout } from "@/types/workout";
import { useWorkoutHistory } from "@/hooks/useWorkoutHistory";
import FavoriteButton from "@/components/FavoriteButton";

function SpinnerIcon() {
  return (
    <svg
      className="animate-spin"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

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
  const {
    history,
    getHistory,
    toggleFavorite,
    deleteWorkout,
    visibleWorkouts,
    visibleFavorites,
    loadMore,
    hasMore,
    hasFavoritesMore,
    resetLimit,
  } = useWorkoutHistory();
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [exportingPDF, setExportingPDF] = useState(false);

  // Reset tab and pagination limit when panel opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab("all");
      resetLimit();
    }
  }, [isOpen, resetLimit]);

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
  const displayed = activeTab === "favorites" ? visibleFavorites : visibleWorkouts;
  const currentHasMore = activeTab === "favorites" ? hasFavoritesMore : hasMore;
  const totalDisplayed = activeTab === "favorites"
    ? allEntries.filter((e) => e.isFavorite).length
    : allEntries.length;

  const favCount = allEntries.filter((e) => e.isFavorite).length;

  function handleExportCSV() {
    const rows: string[][] = [
      ["Data", "Título", "Nível", "Equipamento", "Duração", "Objetivos", "Grupos Musculares", "Favorito"],
      ...history.map((w) => [
        new Date(w.createdAt).toLocaleDateString("pt-BR"),
        w.workout.nome ?? "",
        w.formData.level,
        w.formData.equipment,
        w.formData.duration,
        w.formData.goals.join("; "),
        w.formData.muscleGroups.join("; "),
        w.isFavorite ? "Sim" : "Não",
      ]),
    ];
    const csv = rows
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `FitGen_Historico_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleExportPDF() {
    setExportingPDF(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const W = doc.internal.pageSize.getWidth();
      const m = 20;
      let y = m;

      // Header bar
      doc.setFillColor(249, 115, 22);
      doc.rect(0, 0, W, 14, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("FitGen — Histórico de Treinos", m, 10);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(new Date().toLocaleDateString("pt-BR"), W - m, 10, { align: "right" });
      y = 24;

      // Stats row
      doc.setTextColor(80, 80, 80);
      doc.setFontSize(8);
      doc.text(
        `Total: ${history.length} treinos  ·  Favoritos: ${history.filter((w) => w.isFavorite).length}`,
        m,
        y
      );
      y += 10;

      // Each workout as a row
      history.forEach((w, i) => {
        if (y > 265) {
          doc.addPage();
          y = m;
        }
        const shade = i % 2 === 0 ? 250 : 245;
        doc.setFillColor(shade, shade, shade);
        doc.rect(m, y - 4, W - m * 2, 14, "F");

        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(20, 20, 20);
        doc.text(w.workout.nome ?? w.formData.muscleGroups.join(", "), m + 2, y + 2);

        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        doc.text(
          `${new Date(w.createdAt).toLocaleDateString("pt-BR")}  ·  ${w.formData.level}  ·  ${w.formData.duration}  ·  ${w.formData.goals.join(", ")}`,
          m + 2,
          y + 7
        );

        if (w.isFavorite) {
          doc.setFillColor(249, 115, 22);
          doc.circle(W - m - 3, y + 3, 1.5, "F");
        }
        y += 16;
      });

      doc.save(`FitGen_Historico_${new Date().toISOString().split("T")[0]}.pdf`);
    } finally {
      setExportingPDF(false);
    }
  }

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

        {/* Export buttons row */}
        {allEntries.length > 0 && (
          <div
            className="flex gap-2 px-4 py-2.5 shrink-0"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            <span className="text-xs mr-auto" style={{ color: "#52525b" }}>
              {allEntries.length} treino{allEntries.length > 1 ? "s" : ""}
            </span>
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-lg text-xs transition-all duration-150"
              style={{
                background: "#141414",
                border: "1px solid rgba(255,255,255,0.06)",
                color: "#a1a1aa",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#f97316";
                e.currentTarget.style.color = "#f97316";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                e.currentTarget.style.color = "#a1a1aa";
              }}
            >
              CSV
            </button>
            <button
              onClick={handleExportPDF}
              disabled={exportingPDF}
              className="px-3 py-1.5 rounded-lg text-xs transition-all duration-150 flex items-center gap-1.5"
              style={{
                background: "#141414",
                border: "1px solid rgba(255,255,255,0.06)",
                color: "#a1a1aa",
                opacity: exportingPDF ? 0.6 : 1,
                cursor: exportingPDF ? "not-allowed" : "pointer",
              }}
              onMouseEnter={(e) => {
                if (!exportingPDF) {
                  e.currentTarget.style.borderColor = "#f97316";
                  e.currentTarget.style.color = "#f97316";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                e.currentTarget.style.color = "#a1a1aa";
              }}
            >
              {exportingPDF ? <SpinnerIcon /> : null}
              PDF
            </button>
          </div>
        )}

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
            <>
            {displayed.map((entry) => (
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
            ))}
            {currentHasMore && (
              <button
                onClick={loadMore}
                className="w-full py-2.5 rounded-xl text-sm font-medium transition-all mt-2"
                style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)", color: "#a1a1aa" }}
                onMouseEnter={e => { e.currentTarget.style.color = "#fafafa"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.10)"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "#a1a1aa"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
              >
                Ver mais ({totalDisplayed - displayed.length} restantes)
              </button>
            )}
            </>
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
