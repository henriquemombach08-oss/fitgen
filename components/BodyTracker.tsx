"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Measurement {
  id: string;
  date: string;
  weight?: number;
  body_fat?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  bicep?: number;
}

interface FormState {
  date: string;
  weight: string;
  body_fat: string;
  chest: string;
  waist: string;
  hips: string;
  bicep: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

function emptyForm(): FormState {
  return {
    date: todayISO(),
    weight: "",
    body_fat: "",
    chest: "",
    waist: "",
    hips: "",
    bicep: "",
  };
}

// ─── Mini weight SVG chart ────────────────────────────────────────────────────

function WeightChart({ measurements }: { measurements: Measurement[] }) {
  const withWeight = measurements
    .filter((m) => m.weight != null)
    .slice(0, 10)
    .reverse();

  if (withWeight.length < 2) return null;

  const weights = withWeight.map((m) => m.weight as number);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const range = maxW - minW || 1;

  const W = 200;
  const H = 60;
  const padX = 8;
  const padY = 8;

  const innerW = W - padX * 2;
  const innerH = H - padY * 2;

  const points = withWeight.map((m, i) => {
    const x = padX + (i / (withWeight.length - 1)) * innerW;
    const y = padY + innerH - ((( m.weight as number) - minW) / range) * innerH;
    return { x, y };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(" ");

  const first = weights[0];
  const last = weights[weights.length - 1];
  const color =
    last < first ? "#10b981" : last > first ? "#f87171" : "#52525b";

  const firstDate = formatDate(withWeight[0].date);
  const lastDate = formatDate(withWeight[withWeight.length - 1].date);

  return (
    <div style={{ marginTop: "12px" }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
        <polyline
          points={polylinePoints}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="2.5" fill={color} />
        ))}
      </svg>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "10px",
          color: "#52525b",
          width: `${W}px`,
          marginTop: "2px",
        }}
      >
        <span>{firstDate}</span>
        <span>{lastDate}</span>
      </div>
    </div>
  );
}

// ─── Input style helper ───────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#141414",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "8px",
  padding: "7px 10px",
  color: "#fafafa",
  fontSize: "13px",
  outline: "none",
  boxSizing: "border-box",
};

// ─── Main component ───────────────────────────────────────────────────────────

export default function BodyTracker() {
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [activeTab, setActiveTab] = useState<"log" | "historico">("log");

  // ── Load user + data on open ────────────────────────────────────────────────

  useEffect(() => {
    if (!open) return;

    async function init() {
      setLoading(true);
      const supabase = getSupabase();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setUserId(null);
        setLoading(false);
        return;
      }

      setUserId(user.id);
      await fetchMeasurements(user.id);
      setLoading(false);
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function fetchMeasurements(uid: string) {
    const supabase = getSupabase();
    const { data } = await supabase
      .from("body_measurements")
      .select("id, date, weight, body_fat, chest, waist, hips, bicep")
      .eq("user_id", uid)
      .order("date", { ascending: false })
      .limit(30);

    if (data) setMeasurements(data as Measurement[]);
  }

  // ── Form helpers ────────────────────────────────────────────────────────────

  function handleFormChange(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    if (!userId) return;
    setSaving(true);

    const supabase = getSupabase();
    const payload: Record<string, string | number | null> = {
      user_id: userId,
      date: form.date || todayISO(),
      weight: form.weight !== "" ? parseFloat(form.weight) : null,
      body_fat: form.body_fat !== "" ? parseFloat(form.body_fat) : null,
      chest: form.chest !== "" ? parseFloat(form.chest) : null,
      waist: form.waist !== "" ? parseFloat(form.waist) : null,
      hips: form.hips !== "" ? parseFloat(form.hips) : null,
      bicep: form.bicep !== "" ? parseFloat(form.bicep) : null,
    };

    const { error } = await supabase.from("body_measurements").insert(payload);

    if (!error) {
      setForm(emptyForm());
      await fetchMeasurements(userId);
      setActiveTab("historico");
    }

    setSaving(false);
  }

  // ── Weight trend helper ─────────────────────────────────────────────────────

  function weightTrend(current: number | undefined, previous: number | undefined) {
    if (current == null || previous == null) return null;
    if (current < previous)
      return <span style={{ color: "#10b981", fontWeight: 600 }}> ↓</span>;
    if (current > previous)
      return <span style={{ color: "#f87171", fontWeight: 600 }}> ↑</span>;
    return <span style={{ color: "#52525b", fontWeight: 600 }}> →</span>;
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Medidas corporais"
        title="Medidas corporais"
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
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
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
            <div
              style={{
                height: "1px",
                background: "rgba(16,185,129,0.40)",
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
                  Medidas Corporais
                </h2>
                <p className="text-xs mt-0.5" style={{ color: "#52525b" }}>
                  Acompanhe seu progresso físico
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  color: "#52525b",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = "#fafafa";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = "#52525b";
                }}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Tabs */}
            <div
              className="flex"
              style={{
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                flexShrink: 0,
                paddingLeft: "20px",
                gap: "0",
              }}
            >
              {(["log", "historico"] as const).map((tab) => {
                const active = activeTab === tab;
                const label = tab === "log" ? "Registrar" : "Histórico";
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      padding: "10px 16px",
                      fontSize: "12px",
                      fontWeight: active ? 600 : 400,
                      color: active ? "#10b981" : "#52525b",
                      background: "transparent",
                      border: "none",
                      borderBottom: active
                        ? "2px solid #10b981"
                        : "2px solid transparent",
                      cursor: "pointer",
                      transition: "color 0.15s",
                      marginBottom: "-1px",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Content */}
            <div
              className="overflow-y-auto"
              style={{ padding: "20px", flex: 1 }}
            >
              {loading ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "120px",
                    color: "#52525b",
                    fontSize: "13px",
                  }}
                >
                  Carregando...
                </div>
              ) : !userId ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "120px",
                    color: "#52525b",
                    fontSize: "13px",
                    textAlign: "center",
                  }}
                >
                  Faça login para registrar suas medidas
                </div>
              ) : activeTab === "log" ? (
                <LogTab
                  form={form}
                  saving={saving}
                  onChange={handleFormChange}
                  onSave={handleSave}
                />
              ) : (
                <HistoricoTab measurements={measurements} weightTrend={weightTrend} />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Log Tab ──────────────────────────────────────────────────────────────────

function LogTab({
  form,
  saving,
  onChange,
  onSave,
}: {
  form: FormState;
  saving: boolean;
  onChange: (field: keyof FormState, value: string) => void;
  onSave: () => void;
}) {
  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "11px",
    fontWeight: 500,
    color: "#a1a1aa",
    marginBottom: "4px",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Date */}
      <div>
        <label style={labelStyle}>Data</label>
        <input
          type="date"
          value={form.date}
          onChange={(e) => onChange("date", e.target.value)}
          style={{
            ...inputStyle,
            colorScheme: "dark",
          }}
        />
      </div>

      {/* Measurement fields — 2 columns */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
        }}
      >
        <div>
          <label style={labelStyle}>Peso (kg)</label>
          <input
            type="number"
            min="0"
            step="0.1"
            placeholder="ex: 80.5"
            value={form.weight}
            onChange={(e) => onChange("weight", e.target.value)}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Gordura (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            placeholder="ex: 18.5"
            value={form.body_fat}
            onChange={(e) => onChange("body_fat", e.target.value)}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Peito (cm)</label>
          <input
            type="number"
            min="0"
            step="0.1"
            placeholder="ex: 100"
            value={form.chest}
            onChange={(e) => onChange("chest", e.target.value)}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Cintura (cm)</label>
          <input
            type="number"
            min="0"
            step="0.1"
            placeholder="ex: 80"
            value={form.waist}
            onChange={(e) => onChange("waist", e.target.value)}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Quadril (cm)</label>
          <input
            type="number"
            min="0"
            step="0.1"
            placeholder="ex: 95"
            value={form.hips}
            onChange={(e) => onChange("hips", e.target.value)}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Bíceps (cm)</label>
          <input
            type="number"
            min="0"
            step="0.1"
            placeholder="ex: 35"
            value={form.bicep}
            onChange={(e) => onChange("bicep", e.target.value)}
            style={inputStyle}
          />
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={onSave}
        disabled={saving}
        style={{
          width: "100%",
          padding: "10px",
          borderRadius: "10px",
          background: saving ? "#052e16" : "#10b981",
          color: saving ? "#6ee7b7" : "#0f0f0f",
          fontWeight: 600,
          fontSize: "13px",
          border: "none",
          cursor: saving ? "not-allowed" : "pointer",
          transition: "background 0.15s",
          marginTop: "4px",
        }}
      >
        {saving ? "Salvando..." : "Salvar Medidas"}
      </button>
    </div>
  );
}

// ─── Histórico Tab ────────────────────────────────────────────────────────────

function HistoricoTab({
  measurements,
  weightTrend,
}: {
  measurements: Measurement[];
  weightTrend: (
    current: number | undefined,
    previous: number | undefined
  ) => React.ReactNode;
}) {
  const recent = measurements.slice(0, 10);

  if (recent.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "120px",
          color: "#52525b",
          fontSize: "13px",
          textAlign: "center",
        }}
      >
        Nenhuma medida registrada ainda.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Mini weight chart */}
      <WeightChart measurements={recent} />

      {/* Measurement cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {recent.map((m, i) => {
          const prev = recent[i + 1];
          return (
            <div
              key={m.id}
              style={{
                background: "#141414",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "12px",
                padding: "12px 14px",
              }}
            >
              {/* Date + weight row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  marginBottom: "6px",
                }}
              >
                <span style={{ fontSize: "11px", color: "#52525b" }}>
                  {formatDate(m.date)}
                </span>
                {m.weight != null && (
                  <span
                    style={{
                      fontSize: "18px",
                      fontWeight: 700,
                      color: "#fafafa",
                    }}
                  >
                    {m.weight}
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 400,
                        color: "#52525b",
                        marginLeft: "3px",
                      }}
                    >
                      kg
                    </span>
                    {weightTrend(m.weight, prev?.weight)}
                  </span>
                )}
              </div>

              {/* Other metrics */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                {m.body_fat != null && (
                  <Chip label="Gordura" value={`${m.body_fat}%`} />
                )}
                {m.chest != null && (
                  <Chip label="Peito" value={`${m.chest}cm`} />
                )}
                {m.waist != null && (
                  <Chip label="Cintura" value={`${m.waist}cm`} />
                )}
                {m.hips != null && (
                  <Chip label="Quadril" value={`${m.hips}cm`} />
                )}
                {m.bicep != null && (
                  <Chip label="Bíceps" value={`${m.bicep}cm`} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Chip helper ─────────────────────────────────────────────────────────────

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "6px",
        padding: "3px 8px",
        fontSize: "11px",
        color: "#a1a1aa",
        display: "flex",
        gap: "4px",
        alignItems: "center",
      }}
    >
      <span style={{ color: "#52525b" }}>{label}</span>
      <span style={{ color: "#fafafa", fontWeight: 500 }}>{value}</span>
    </div>
  );
}
