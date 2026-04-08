"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SupplementEntry {
  id: string;
  name: string;
  dose: string;
  timing: string;
  evidencia: "A" | "B" | "C";
}

interface NewSuppForm {
  name: string;
  dose: string;
  timing: string;
  evidencia: "A" | "B" | "C";
}

// ─── Defaults ────────────────────────────────────────────────────────────────

const defaultSupplements: SupplementEntry[] = [
  { id: "creatina",  name: "Creatina",    dose: "5g",          timing: "Qualquer horário",       evidencia: "A" },
  { id: "whey",      name: "Whey Protein", dose: "25-30g",     timing: "Pós-treino",              evidencia: "A" },
  { id: "cafeina",   name: "Cafeína",     dose: "200mg",       timing: "30-45min pré-treino",     evidencia: "A" },
  { id: "vitd",      name: "Vitamina D3", dose: "2000-4000 UI", timing: "Com refeição",           evidencia: "B" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

function formatDatePtBR(iso: string): string {
  const [year, month, day] = iso.split("-");
  const months = [
    "jan", "fev", "mar", "abr", "mai", "jun",
    "jul", "ago", "set", "out", "nov", "dez",
  ];
  return `${parseInt(day)} de ${months[parseInt(month) - 1]} de ${year}`;
}

function getWeekDays(): { iso: string; short: string }[] {
  const days: { iso: string; short: string }[] = [];
  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().split("T")[0];
    days.push({ iso, short: dayNames[d.getDay()] });
  }
  return days;
}

const evidenceColors: Record<string, string> = {
  A: "#10b981",
  B: "#eab308",
  C: "#71717a",
};

const evidenceLabels: Record<string, string> = {
  A: "Evidência forte",
  B: "Evidência moderada",
  C: "Evidência limitada",
};

const STORAGE_KEY_SUPPS = "fitgen-supplements";
function logKey(date: string) {
  return `fitgen-supp-log-${date}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SupplementTracker() {
  const [open, setOpen] = useState(false);
  const [supplements, setSupplements] = useState<SupplementEntry[]>([]);
  const [todayLog, setTodayLog] = useState<string[]>([]);
  const [addingNew, setAddingNew] = useState(false);
  const [newSuppForm, setNewSuppForm] = useState<NewSuppForm>({
    name: "",
    dose: "",
    timing: "",
    evidencia: "B",
  });
  const [weeklyOpen, setWeeklyOpen] = useState(false);
  const [weeklyData, setWeeklyData] = useState<Record<string, number>>({});

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(STORAGE_KEY_SUPPS);
    if (stored) {
      try {
        setSupplements(JSON.parse(stored) as SupplementEntry[]);
      } catch {
        setSupplements(defaultSupplements);
      }
    } else {
      setSupplements(defaultSupplements);
    }

    const today = todayISO();
    const storedLog = localStorage.getItem(logKey(today));
    if (storedLog) {
      try {
        setTodayLog(JSON.parse(storedLog) as string[]);
      } catch {
        setTodayLog([]);
      }
    }
  }, []);

  // Load weekly data when panel opens or weeklyOpen changes
  const loadWeeklyData = useCallback(() => {
    if (typeof window === "undefined") return;
    const days = getWeekDays();
    const data: Record<string, number> = {};
    for (const { iso } of days) {
      const stored = localStorage.getItem(logKey(iso));
      if (stored) {
        try {
          const log = JSON.parse(stored) as string[];
          data[iso] = log.length;
        } catch {
          data[iso] = 0;
        }
      } else {
        data[iso] = 0;
      }
    }
    setWeeklyData(data);
  }, []);

  useEffect(() => {
    if (open && weeklyOpen) loadWeeklyData();
  }, [open, weeklyOpen, loadWeeklyData]);

  // Persist supplements
  const persistSupplements = (list: SupplementEntry[]) => {
    setSupplements(list);
    localStorage.setItem(STORAGE_KEY_SUPPS, JSON.stringify(list));
  };

  // Persist today's log
  const persistLog = (log: string[]) => {
    setTodayLog(log);
    const today = todayISO();
    localStorage.setItem(logKey(today), JSON.stringify(log));
  };

  const toggleTaken = (id: string) => {
    const next = todayLog.includes(id)
      ? todayLog.filter((x) => x !== id)
      : [...todayLog, id];
    persistLog(next);
  };

  const removeSupp = (id: string) => {
    const next = supplements.filter((s) => s.id !== id);
    persistSupplements(next);
    if (todayLog.includes(id)) {
      persistLog(todayLog.filter((x) => x !== id));
    }
  };

  const saveNewSupp = () => {
    if (!newSuppForm.name.trim()) return;
    const id =
      newSuppForm.name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now();
    const entry: SupplementEntry = {
      id,
      name: newSuppForm.name.trim(),
      dose: newSuppForm.dose.trim(),
      timing: newSuppForm.timing.trim(),
      evidencia: newSuppForm.evidencia,
    };
    persistSupplements([...supplements, entry]);
    setNewSuppForm({ name: "", dose: "", timing: "", evidencia: "B" });
    setAddingNew(false);
  };

  const today = todayISO();
  const takenCount = todayLog.filter((id) =>
    supplements.some((s) => s.id === id)
  ).length;
  const totalCount = supplements.length;
  const progress = totalCount > 0 ? (takenCount / totalCount) * 100 : 0;

  const weekDays = getWeekDays();

  return (
    <>
      {/* ── Trigger button ── */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Rastreador de Suplementos"
        title="Rastreador de Suplementos"
        className="w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-150 active:scale-90"
        style={{
          background: "#141414",
          border: "1px solid rgba(255,255,255,0.06)",
          color: "#a1a1aa",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor =
            "rgba(16,185,129,0.3)";
          (e.currentTarget as HTMLButtonElement).style.color = "#10b981";
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
          <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
          <path d="m8.5 8.5 7 7" />
        </svg>
      </button>

      {/* ── Modal ── */}
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
            className="relative w-full max-w-sm rounded-2xl shadow-2xl flex flex-col"
            style={{
              background: "#0f0f0f",
              border: "1px solid rgba(255,255,255,0.06)",
              maxHeight: "85vh",
            }}
          >
            {/* Top accent line */}
            <div
              style={{
                height: "1px",
                background: "rgba(16,185,129,0.40)",
                flexShrink: 0,
                borderRadius: "16px 16px 0 0",
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
                  Suplementos de Hoje
                </h2>
                <p className="text-xs mt-0.5" style={{ color: "#52525b" }}>
                  {formatDatePtBR(today)}
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Fechar"
                className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
                style={{ color: "#52525b" }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.color =
                    "#fafafa")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.color =
                    "#52525b")
                }
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

              {/* ── Progress bar ── */}
              <div>
                <div
                  className="flex items-center justify-between mb-2"
                >
                  <span className="text-xs font-medium" style={{ color: "#a1a1aa" }}>
                    {takenCount} de {totalCount} tomados hoje
                  </span>
                  <span
                    className="text-xs font-bold"
                    style={{ color: "#10b981" }}
                  >
                    {totalCount > 0 ? Math.round(progress) : 0}%
                  </span>
                </div>
                <div
                  className="w-full rounded-full overflow-hidden"
                  style={{
                    height: "6px",
                    background: "rgba(255,255,255,0.06)",
                  }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${progress}%`,
                      background: "#10b981",
                    }}
                  />
                </div>
              </div>

              {/* ── Supplement list ── */}
              <div className="space-y-2">
                {supplements.map((s) => {
                  const taken = todayLog.includes(s.id);
                  return (
                    <div
                      key={s.id}
                      className="flex items-center gap-3 rounded-xl px-3 py-3 transition-opacity duration-200"
                      style={{
                        background: "#141414",
                        border: "1px solid rgba(255,255,255,0.06)",
                        opacity: taken ? 0.5 : 1,
                      }}
                    >
                      {/* Checkbox */}
                      <button
                        onClick={() => toggleTaken(s.id)}
                        aria-label={taken ? `Desmarcar ${s.name}` : `Marcar ${s.name}`}
                        className="flex-shrink-0 rounded-md flex items-center justify-center transition-all duration-150 active:scale-90"
                        style={{
                          width: "20px",
                          height: "20px",
                          background: taken ? "#10b981" : "#0f0f0f",
                          border: taken
                            ? "1px solid #10b981"
                            : "1px solid rgba(255,255,255,0.15)",
                        }}
                      >
                        {taken && (
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 12 12"
                            fill="none"
                            stroke="#fff"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="2,6 5,9 10,3" />
                          </svg>
                        )}
                      </button>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className="text-sm font-semibold truncate"
                            style={{
                              color: "#fafafa",
                              textDecoration: taken ? "line-through" : "none",
                            }}
                          >
                            {s.name}
                          </span>
                          <span
                            className="text-xs flex-shrink-0"
                            style={{ color: "#a1a1aa" }}
                          >
                            {s.dose}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {/* Timing badge */}
                          <span
                            className="text-xs rounded-full px-2 py-0.5 flex-shrink-0"
                            style={{
                              background: "rgba(255,255,255,0.05)",
                              color: "#71717a",
                              border: "1px solid rgba(255,255,255,0.06)",
                              fontSize: "10px",
                            }}
                          >
                            {s.timing}
                          </span>
                          {/* Evidence dot */}
                          <div
                            className="flex items-center gap-1 flex-shrink-0"
                            title={evidenceLabels[s.evidencia]}
                          >
                            <div
                              className="rounded-full flex-shrink-0"
                              style={{
                                width: "6px",
                                height: "6px",
                                background: evidenceColors[s.evidencia],
                              }}
                            />
                            <span
                              style={{
                                color: evidenceColors[s.evidencia],
                                fontSize: "10px",
                                fontWeight: 600,
                              }}
                            >
                              {s.evidencia}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Remove button */}
                      <button
                        onClick={() => removeSupp(s.id)}
                        aria-label={`Remover ${s.name}`}
                        className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md transition-all duration-150 active:scale-90"
                        style={{ color: "#52525b" }}
                        onMouseEnter={(e) =>
                          ((e.currentTarget as HTMLButtonElement).style.color =
                            "#ef4444")
                        }
                        onMouseLeave={(e) =>
                          ((e.currentTarget as HTMLButtonElement).style.color =
                            "#52525b")
                        }
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  );
                })}

                {supplements.length === 0 && (
                  <p
                    className="text-xs text-center py-4"
                    style={{ color: "#52525b" }}
                  >
                    Nenhum suplemento cadastrado.
                  </p>
                )}
              </div>

              {/* ── Add new supplement ── */}
              {!addingNew ? (
                <button
                  onClick={() => setAddingNew(true)}
                  className="w-full rounded-xl py-3 text-sm font-medium transition-all duration-150 active:scale-[0.98]"
                  style={{
                    background: "transparent",
                    border: "1px dashed rgba(16,185,129,0.30)",
                    color: "#10b981",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      "rgba(16,185,129,0.60)";
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "rgba(16,185,129,0.04)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      "rgba(16,185,129,0.30)";
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "transparent";
                  }}
                >
                  + Adicionar suplemento
                </button>
              ) : (
                <div
                  className="rounded-xl p-4 space-y-3"
                  style={{
                    background: "#141414",
                    border: "1px solid rgba(16,185,129,0.20)",
                  }}
                >
                  <p
                    className="text-xs font-semibold uppercase tracking-widest"
                    style={{ color: "#10b981" }}
                  >
                    Novo suplemento
                  </p>

                  {/* Name */}
                  <div>
                    <label
                      className="block text-xs font-medium mb-1"
                      style={{ color: "#a1a1aa" }}
                    >
                      Nome
                    </label>
                    <input
                      type="text"
                      placeholder="ex: Ômega-3"
                      value={newSuppForm.name}
                      onChange={(e) =>
                        setNewSuppForm((f) => ({ ...f, name: e.target.value }))
                      }
                      className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-all"
                      style={{
                        background: "#0f0f0f",
                        border: "1px solid rgba(255,255,255,0.06)",
                        color: "#fafafa",
                      }}
                      onFocus={(e) =>
                        ((e.currentTarget as HTMLInputElement).style.borderColor =
                          "rgba(16,185,129,0.30)")
                      }
                      onBlur={(e) =>
                        ((e.currentTarget as HTMLInputElement).style.borderColor =
                          "rgba(255,255,255,0.06)")
                      }
                    />
                  </div>

                  {/* Dose */}
                  <div>
                    <label
                      className="block text-xs font-medium mb-1"
                      style={{ color: "#a1a1aa" }}
                    >
                      Dose
                    </label>
                    <input
                      type="text"
                      placeholder="ex: 1g"
                      value={newSuppForm.dose}
                      onChange={(e) =>
                        setNewSuppForm((f) => ({ ...f, dose: e.target.value }))
                      }
                      className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-all"
                      style={{
                        background: "#0f0f0f",
                        border: "1px solid rgba(255,255,255,0.06)",
                        color: "#fafafa",
                      }}
                      onFocus={(e) =>
                        ((e.currentTarget as HTMLInputElement).style.borderColor =
                          "rgba(16,185,129,0.30)")
                      }
                      onBlur={(e) =>
                        ((e.currentTarget as HTMLInputElement).style.borderColor =
                          "rgba(255,255,255,0.06)")
                      }
                    />
                  </div>

                  {/* Timing */}
                  <div>
                    <label
                      className="block text-xs font-medium mb-1"
                      style={{ color: "#a1a1aa" }}
                    >
                      Horário
                    </label>
                    <input
                      type="text"
                      placeholder="ex: Pós-treino"
                      value={newSuppForm.timing}
                      onChange={(e) =>
                        setNewSuppForm((f) => ({
                          ...f,
                          timing: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-all"
                      style={{
                        background: "#0f0f0f",
                        border: "1px solid rgba(255,255,255,0.06)",
                        color: "#fafafa",
                      }}
                      onFocus={(e) =>
                        ((e.currentTarget as HTMLInputElement).style.borderColor =
                          "rgba(16,185,129,0.30)")
                      }
                      onBlur={(e) =>
                        ((e.currentTarget as HTMLInputElement).style.borderColor =
                          "rgba(255,255,255,0.06)")
                      }
                    />
                  </div>

                  {/* Evidencia */}
                  <div>
                    <label
                      className="block text-xs font-medium mb-1"
                      style={{ color: "#a1a1aa" }}
                    >
                      Evidência científica
                    </label>
                    <select
                      value={newSuppForm.evidencia}
                      onChange={(e) =>
                        setNewSuppForm((f) => ({
                          ...f,
                          evidencia: e.target.value as "A" | "B" | "C",
                        }))
                      }
                      className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-all"
                      style={{
                        background: "#0f0f0f",
                        border: "1px solid rgba(255,255,255,0.06)",
                        color: "#fafafa",
                      }}
                      onFocus={(e) =>
                        ((e.currentTarget as HTMLSelectElement).style.borderColor =
                          "rgba(16,185,129,0.30)")
                      }
                      onBlur={(e) =>
                        ((e.currentTarget as HTMLSelectElement).style.borderColor =
                          "rgba(255,255,255,0.06)")
                      }
                    >
                      <option value="A">A — Evidência forte</option>
                      <option value="B">B — Evidência moderada</option>
                      <option value="C">C — Evidência limitada</option>
                    </select>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={saveNewSupp}
                      disabled={!newSuppForm.name.trim()}
                      className="flex-1 rounded-lg py-2 text-sm font-semibold transition-all duration-150 active:scale-95"
                      style={{
                        background: newSuppForm.name.trim()
                          ? "#10b981"
                          : "rgba(16,185,129,0.30)",
                        color: newSuppForm.name.trim() ? "#fff" : "#52525b",
                        cursor: newSuppForm.name.trim()
                          ? "pointer"
                          : "not-allowed",
                      }}
                    >
                      Salvar
                    </button>
                    <button
                      onClick={() => {
                        setAddingNew(false);
                        setNewSuppForm({
                          name: "",
                          dose: "",
                          timing: "",
                          evidencia: "B",
                        });
                      }}
                      className="flex-1 rounded-lg py-2 text-sm font-semibold transition-all duration-150 active:scale-95"
                      style={{
                        background: "#0f0f0f",
                        border: "1px solid rgba(255,255,255,0.06)",
                        color: "#a1a1aa",
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* ── Weekly summary ── */}
              <div
                className="rounded-xl overflow-hidden"
                style={{ border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <button
                  onClick={() => {
                    const next = !weeklyOpen;
                    setWeeklyOpen(next);
                    if (next) loadWeeklyData();
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 transition-colors"
                  style={{ background: "#141414", color: "#a1a1aa" }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLButtonElement).style.color =
                      "#fafafa")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLButtonElement).style.color =
                      "#a1a1aa")
                  }
                >
                  <span className="text-xs font-semibold uppercase tracking-widest">
                    Resumo semanal
                  </span>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    style={{
                      transform: weeklyOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s",
                    }}
                  >
                    <polyline points="6,9 12,15 18,9" />
                  </svg>
                </button>

                {weeklyOpen && (
                  <div
                    className="px-4 py-4"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <div className="flex justify-between">
                      {weekDays.map(({ iso, short }) => {
                        const count = weeklyData[iso] ?? 0;
                        const isToday = iso === today;
                        const hasTaken = count > 0;
                        return (
                          <div
                            key={iso}
                            className="flex flex-col items-center gap-1.5"
                          >
                            <div
                              className="rounded-full flex items-center justify-center"
                              style={{
                                width: "28px",
                                height: "28px",
                                background: hasTaken
                                  ? "#10b981"
                                  : "rgba(255,255,255,0.04)",
                                border: isToday
                                  ? "2px solid rgba(16,185,129,0.60)"
                                  : hasTaken
                                  ? "none"
                                  : "1px solid rgba(255,255,255,0.08)",
                              }}
                            >
                              {hasTaken && (
                                <svg
                                  width="10"
                                  height="10"
                                  viewBox="0 0 12 12"
                                  fill="none"
                                  stroke="#fff"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <polyline points="2,6 5,9 10,3" />
                                </svg>
                              )}
                            </div>
                            <span
                              className="text-center"
                              style={{
                                fontSize: "9px",
                                color: isToday ? "#10b981" : "#52525b",
                                fontWeight: isToday ? 700 : 400,
                              }}
                            >
                              {short}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <p
                      className="text-xs text-center mt-3"
                      style={{ color: "#52525b" }}
                    >
                      Círculo preenchido = pelo menos 1 suplemento tomado
                    </p>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}
