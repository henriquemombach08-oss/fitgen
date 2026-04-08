"use client";

import { useState } from "react";

// ─── Formula definitions ───────────────────────────────────────────────────────

const FORMULAS: Record<string, (w: number, r: number) => number> = {
  Epley:     (w, r) => r === 1 ? w : w * (1 + r / 30),
  Brzycki:   (w, r) => r === 1 ? w : w * (36 / (37 - r)),
  Lombardi:  (w, r) => r === 1 ? w : w * Math.pow(r, 0.1),
  "O'Conner": (w, r) => r === 1 ? w : w * (1 + r / 40),
};

const PERCENTAGE_TABLE: { pct: number; label: string; reps: string }[] = [
  { pct: 100, label: "100%", reps: "1" },
  { pct: 95,  label: "95%",  reps: "2–3" },
  { pct: 90,  label: "90%",  reps: "4–5" },
  { pct: 85,  label: "85%",  reps: "6–7" },
  { pct: 80,  label: "80%",  reps: "8–9" },
  { pct: 75,  label: "75%",  reps: "10–12" },
  { pct: 70,  label: "70%",  reps: "12–15" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function OneRMCalculator() {
  const [open, setOpen] = useState(false);
  const [weightStr, setWeightStr] = useState("");
  const [repsStr, setRepsStr] = useState("");

  const weight = parseFloat(weightStr);
  const reps = parseInt(repsStr, 10);
  const isValid = !isNaN(weight) && weight > 0 && !isNaN(reps) && reps >= 1;

  const formulaResults = isValid
    ? Object.entries(FORMULAS).map(([name, fn]) => ({
        name,
        result: fn(weight, reps),
      }))
    : null;

  const average =
    formulaResults
      ? formulaResults.reduce((sum, { result }) => sum + result, 0) / formulaResults.length
      : null;

  const isDirectLoad = isValid && reps === 1;

  return (
    <>
      {/* ── Trigger button ── */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Calculadora 1RM"
        title="Calculadora de 1RM"
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
          <path d="M6 4v16M18 4v16M4 8h4M16 8h4M4 16h4M16 16h4M8 12h8"/>
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
            className="relative w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            style={{
              background: "#0f0f0f",
              border: "1px solid rgba(255,255,255,0.06)",
              maxHeight: "90vh",
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
                  Calculadora 1RM
                </h2>
                <p className="text-xs mt-0.5" style={{ color: "#52525b" }}>
                  One Rep Max — carga máxima estimada
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

            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

              {/* ── Inputs ── */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="orm-weight"
                    className="block text-xs font-medium mb-1.5"
                    style={{ color: "#a1a1aa" }}
                  >
                    Peso levantado (kg)
                  </label>
                  <input
                    id="orm-weight"
                    type="number"
                    min={1}
                    max={500}
                    placeholder="ex: 100"
                    value={weightStr}
                    onChange={(e) => setWeightStr(e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-all"
                    style={{
                      background: "#141414",
                      border: "1px solid rgba(255,255,255,0.06)",
                      color: "#fafafa",
                    }}
                    onFocus={(e) =>
                      ((e.currentTarget as HTMLInputElement).style.borderColor =
                        "rgba(249,115,22,0.30)")
                    }
                    onBlur={(e) =>
                      ((e.currentTarget as HTMLInputElement).style.borderColor =
                        "rgba(255,255,255,0.06)")
                    }
                  />
                </div>
                <div>
                  <label
                    htmlFor="orm-reps"
                    className="block text-xs font-medium mb-1.5"
                    style={{ color: "#a1a1aa" }}
                  >
                    Repetições
                  </label>
                  <input
                    id="orm-reps"
                    type="number"
                    min={1}
                    max={30}
                    placeholder="ex: 5"
                    value={repsStr}
                    onChange={(e) => setRepsStr(e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-all"
                    style={{
                      background: "#141414",
                      border: "1px solid rgba(255,255,255,0.06)",
                      color: "#fafafa",
                    }}
                    onFocus={(e) =>
                      ((e.currentTarget as HTMLInputElement).style.borderColor =
                        "rgba(249,115,22,0.30)")
                    }
                    onBlur={(e) =>
                      ((e.currentTarget as HTMLInputElement).style.borderColor =
                        "rgba(255,255,255,0.06)")
                    }
                  />
                </div>
              </div>

              {/* ── Main result card ── */}
              <div
                className="rounded-xl px-4 py-4 text-center"
                style={{
                  background: "rgba(249,115,22,0.08)",
                  border: "1px solid rgba(249,115,22,0.25)",
                }}
              >
                <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#f97316" }}>
                  1RM Estimado
                </p>
                <p className="text-3xl font-black" style={{ color: "#fafafa" }}>
                  {isValid
                    ? `${average!.toFixed(1)} kg`
                    : "— kg"}
                </p>
                <p className="text-xs mt-1.5" style={{ color: "#52525b" }}>
                  {isDirectLoad
                    ? "Carga direta (1RM real)"
                    : "Média de 4 fórmulas científicas"}
                </p>
              </div>

              {/* ── Formula breakdown ── */}
              {!isDirectLoad && (
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(FORMULAS).map(([name, fn]) => {
                    const result = isValid ? fn(weight, reps) : null;
                    return (
                      <div
                        key={name}
                        className="rounded-lg px-3 py-2.5"
                        style={{
                          background: "#141414",
                          border: "1px solid rgba(255,255,255,0.06)",
                        }}
                      >
                        <p className="text-xs font-medium" style={{ color: "#52525b" }}>
                          {name}
                        </p>
                        <p className="text-sm font-bold mt-0.5" style={{ color: "#fafafa" }}>
                          {result !== null ? `${result.toFixed(1)} kg` : "—"}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── Percentage table ── */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#a1a1aa" }}>
                  Tabela de Carga por %
                </p>
                <div
                  className="rounded-xl overflow-hidden"
                  style={{ border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  {/* Table header */}
                  <div
                    className="grid grid-cols-3 px-3 py-2"
                    style={{
                      background: "#141414",
                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <span className="text-xs font-semibold" style={{ color: "#52525b" }}>%</span>
                    <span className="text-xs font-semibold" style={{ color: "#52525b" }}>Carga</span>
                    <span className="text-xs font-semibold" style={{ color: "#52525b" }}>Reps</span>
                  </div>

                  {/* Table rows */}
                  {PERCENTAGE_TABLE.map(({ pct, label, reps: repRange }, idx) => {
                    const load = average !== null ? (average * pct) / 100 : null;
                    const isLast = idx === PERCENTAGE_TABLE.length - 1;
                    return (
                      <div
                        key={pct}
                        className="grid grid-cols-3 px-3 py-2"
                        style={{
                          borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.04)",
                        }}
                      >
                        <span
                          className="text-xs font-bold"
                          style={{ color: pct === 100 ? "#f97316" : "#a1a1aa" }}
                        >
                          {label}
                        </span>
                        <span className="text-xs font-medium" style={{ color: "#fafafa" }}>
                          {load !== null ? `${load.toFixed(1)} kg` : "—"}
                        </span>
                        <span className="text-xs" style={{ color: "#52525b" }}>
                          {repRange}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}
