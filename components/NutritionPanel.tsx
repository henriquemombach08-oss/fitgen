"use client";

import { useState } from "react";
import { BodyData, NutritionPlan, ActivityLevel, Sex } from "@/types/nutrition";
import { WorkoutFormData } from "@/types/workout";

interface Props {
  userProfile?: Pick<WorkoutFormData, "level" | "goals" | "equipment">;
}

const activityOptions: { value: ActivityLevel; label: string; desc: string }[] = [
  { value: "Sedentário", label: "Sedentário", desc: "Pouco ou nenhum exercício" },
  { value: "Levemente ativo", label: "Levemente ativo", desc: "1-3x treino/semana" },
  { value: "Moderadamente ativo", label: "Moderado", desc: "3-5x treino/semana" },
  { value: "Muito ativo", label: "Muito ativo", desc: "6-7x treino/semana" },
  { value: "Extremamente ativo", label: "Extremo", desc: "2x/dia ou trabalho físico pesado" },
];

const evidenceDotColors: Record<string, string> = {
  A: "#10b981",
  B: "#eab308",
  C: "#71717a",
};

const evidenceLabels: Record<string, string> = {
  A: "Evidência forte",
  B: "Evidência moderada",
  C: "Evidência limitada",
};

function MacroBar({ protein, carbs, fat }: { protein: number; carbs: number; fat: number }) {
  const total = protein * 4 + carbs * 4 + fat * 9;
  const pPct = Math.round((protein * 4 / total) * 100);
  const cPct = Math.round((carbs * 4 / total) * 100);
  const fPct = 100 - pPct - cPct;
  return (
    <div className="space-y-1">
      <div className="flex h-1.5 rounded-full overflow-hidden gap-0.5">
        <div className="bg-blue-500 rounded-l-full" style={{ width: `${pPct}%` }} />
        <div className="bg-orange-400" style={{ width: `${cPct}%` }} />
        <div className="bg-yellow-500 rounded-r-full" style={{ width: `${fPct}%` }} />
      </div>
      <div className="flex justify-between text-xs" style={{ color: "#52525b" }}>
        <span><span className="text-blue-400">P</span> {pPct}%</span>
        <span><span className="text-orange-400">C</span> {cPct}%</span>
        <span><span className="text-yellow-400">G</span> {fPct}%</span>
      </div>
    </div>
  );
}

function MacroCard({
  label,
  macros,
  isTraining,
}: {
  label: string;
  macros: { calories: number; protein: number; carbs: number; fat: number };
  isTraining: boolean;
}) {
  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: "#141414",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <p
        className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5"
        style={{ color: isTraining ? "#f97316" : "#52525b" }}
      >
        <span
          className="inline-block w-1.5 h-1.5 rounded-full"
          style={{ background: isTraining ? "#f97316" : "#52525b" }}
        />
        {label}
      </p>
      <p
        className="text-2xl font-black mb-1"
        style={{ color: isTraining ? "#fafafa" : "#a1a1aa" }}
      >
        {macros.calories}{" "}
        <span className="text-sm font-normal" style={{ color: "#52525b" }}>
          kcal
        </span>
      </p>
      <div className="grid grid-cols-3 gap-2 mb-3 text-center">
        <div>
          <p className="text-blue-400 font-bold text-sm">{macros.protein}g</p>
          <p className="text-xs" style={{ color: "#52525b" }}>Proteína</p>
        </div>
        <div>
          <p className="text-orange-400 font-bold text-sm">{macros.carbs}g</p>
          <p className="text-xs" style={{ color: "#52525b" }}>Carbo</p>
        </div>
        <div>
          <p className="text-yellow-400 font-bold text-sm">{macros.fat}g</p>
          <p className="text-xs" style={{ color: "#52525b" }}>Gordura</p>
        </div>
      </div>
      <MacroBar protein={macros.protein} carbs={macros.carbs} fat={macros.fat} />
    </div>
  );
}

type NutritionGoal =
  | "Hipertrofia"
  | "Força"
  | "Emagrecimento"
  | "Recomposição Corporal"
  | "Resistência"
  | "Potência"
  | "Contest Prep / Definição"
  | "Powerlifting";

const nutritionGoalOptions: { value: NutritionGoal; icon: string; desc: string }[] = [
  { value: "Hipertrofia",              icon: "📈", desc: "Ganhar massa muscular" },
  { value: "Força",                    icon: "🏋️", desc: "Aumentar força máxima" },
  { value: "Emagrecimento",            icon: "🔥", desc: "Perder gordura corporal" },
  { value: "Recomposição Corporal",    icon: "⚖️", desc: "Ganhar músculo e perder gordura" },
  { value: "Resistência",              icon: "🏃", desc: "Melhorar performance aeróbica" },
  { value: "Potência",                 icon: "⚡", desc: "Explosão e velocidade" },
  { value: "Contest Prep / Definição", icon: "🏆", desc: "Preparação para competição" },
  { value: "Powerlifting",             icon: "🥇", desc: "Squat, Bench, Deadlift máximos" },
];

export default function NutritionPanel({ userProfile }: Props) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"form" | "loading" | "result">("form");
  const [plan, setPlan] = useState<NutritionPlan | null>(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"macros" | "refeicoes" | "suplementos" | "periodizacao">("macros");
  const [nutritionGoal, setNutritionGoal] = useState<NutritionGoal>(
    (userProfile?.goals?.[0] as NutritionGoal) ?? "Hipertrofia"
  );

  const [body, setBody] = useState<BodyData>({
    weight: 80,
    height: 175,
    age: 25,
    sex: "M",
    activityLevel: "Moderadamente ativo",
  });

  function handleClose() {
    setOpen(false);
    setTimeout(() => {
      if (step === "result") return;
      setStep("form");
      setError("");
    }, 300);
  }

  async function handleGenerate() {
    setStep("loading");
    setError("");
    try {
      const res = await fetch("/api/nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bodyData: body,
          level: userProfile?.level ?? "Intermediário",
          goals: [nutritionGoal],
          equipment: userProfile?.equipment ?? "Academia completa",
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error ?? "Erro ao gerar plano.");
        setStep("form");
        return;
      }
      setPlan(data.plan);
      setStep("result");
      setActiveTab("macros");
    } catch {
      setError("Falha na conexão. Tente novamente.");
      setStep("form");
    }
  }

  const surplusLabel = plan
    ? plan.surplus_deficit > 0
      ? `+${plan.surplus_deficit} kcal surplus`
      : plan.surplus_deficit < 0
      ? `${plan.surplus_deficit} kcal déficit`
      : "Manutenção"
    : "";

  const surplusColor = plan
    ? plan.surplus_deficit > 0
      ? "#10b981"
      : plan.surplus_deficit < 0
      ? "#f87171"
      : "#52525b"
    : "";

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Plano nutricional"
        title="Plano nutricional"
        className="w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 active:scale-90"
        style={{
          background: "#141414",
          border: "1px solid rgba(255,255,255,0.06)",
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
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
          <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
        </svg>
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div
            className="absolute inset-0 backdrop-blur-sm"
            style={{ background: "rgba(0,0,0,0.75)" }}
            onClick={handleClose}
          />

          <div
            className="relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            style={{
              background: "#0f0f0f",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {/* Accent bar */}
            <div className="shrink-0" style={{ height: "1px", background: "rgba(16,185,129,0.40)" }} />

            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4 shrink-0"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div>
                <h2 className="font-semibold text-sm" style={{ color: "#fafafa" }}>
                  Plano Nutricional
                </h2>
                <p className="text-xs mt-0.5" style={{ color: "#52525b" }}>
                  {step === "result" && plan
                    ? `${nutritionGoal} · TDEE: ${plan.tdee} kcal · Meta: ${plan.meta_calorica} kcal`
                    : "Baseado em RP + Eric Helms + Layne Norton"}
                </p>
              </div>
              <button
                onClick={handleClose}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-xs transition-colors"
                style={{ color: "#52525b" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#a1a1aa")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#52525b")}
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              {/* ── FORM ── */}
              {step === "form" && (
                <div className="p-5 space-y-5">
                  {/* Objetivo nutricional */}
                  <div className="space-y-2">
                    <label
                      className="block text-xs font-semibold uppercase tracking-wider"
                      style={{ color: "#52525b" }}
                    >
                      Qual é o seu objetivo?
                    </label>
                    <div className="space-y-1.5">
                      {nutritionGoalOptions.map((opt) => {
                        const selected = nutritionGoal === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setNutritionGoal(opt.value)}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
                            style={{
                              background: selected ? "rgba(16,185,129,0.08)" : "#141414",
                              border: selected
                                ? "1px solid rgba(16,185,129,0.20)"
                                : "1px solid rgba(255,255,255,0.06)",
                              color: selected ? "#fafafa" : "#a1a1aa",
                            }}
                          >
                            <span className="text-base">{opt.icon}</span>
                            <div className="flex-1">
                              <p className="text-sm font-medium leading-none">{opt.value}</p>
                              <p className="text-xs mt-0.5" style={{ color: "#52525b" }}>
                                {opt.desc}
                              </p>
                            </div>
                            {selected && (
                              <span className="text-xs" style={{ color: "#10b981" }}>
                                ✓
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sexo */}
                  <div className="space-y-2">
                    <label
                      className="block text-xs font-semibold uppercase tracking-wider"
                      style={{ color: "#52525b" }}
                    >
                      Sexo Biológico
                    </label>
                    <div className="flex gap-3">
                      {(["M", "F"] as Sex[]).map((s) => {
                        const selected = body.sex === s;
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setBody((b) => ({ ...b, sex: s }))}
                            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                            style={{
                              background: selected ? "#141414" : "#141414",
                              border: selected
                                ? "1px solid rgba(249,115,22,0.30)"
                                : "1px solid rgba(255,255,255,0.06)",
                              color: selected ? "#fafafa" : "#a1a1aa",
                            }}
                          >
                            {s === "M" ? "♂ Masculino" : "♀ Feminino"}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Peso / Altura / Idade */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Peso (kg)", key: "weight" as const, min: 40, max: 200 },
                      { label: "Altura (cm)", key: "height" as const, min: 140, max: 230 },
                      { label: "Idade", key: "age" as const, min: 14, max: 80 },
                    ].map(({ label, key, min, max }) => (
                      <div key={key} className="space-y-1.5">
                        <label
                          className="block text-xs font-semibold uppercase tracking-wider"
                          style={{ color: "#52525b" }}
                        >
                          {label}
                        </label>
                        <input
                          type="number"
                          value={body[key]}
                          min={min}
                          max={max}
                          onChange={(e) =>
                            setBody((b) => ({ ...b, [key]: Number(e.target.value) }))
                          }
                          className="w-full rounded-xl px-3 py-2.5 text-sm font-bold text-center focus:outline-none transition-colors"
                          style={{
                            background: "#141414",
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
                    ))}
                  </div>

                  {/* Nível de atividade */}
                  <div className="space-y-2">
                    <label
                      className="block text-xs font-semibold uppercase tracking-wider"
                      style={{ color: "#52525b" }}
                    >
                      Nível de Atividade
                    </label>
                    <div className="space-y-1.5">
                      {activityOptions.map((opt) => {
                        const selected = body.activityLevel === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setBody((b) => ({ ...b, activityLevel: opt.value }))}
                            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-left transition-all"
                            style={{
                              background: selected ? "rgba(16,185,129,0.08)" : "#141414",
                              border: selected
                                ? "1px solid rgba(16,185,129,0.20)"
                                : "1px solid rgba(255,255,255,0.06)",
                              color: selected ? "#fafafa" : "#a1a1aa",
                            }}
                          >
                            <span className="text-sm font-medium">{opt.label}</span>
                            <span className="text-xs" style={{ color: "#52525b" }}>
                              {opt.desc}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {error && (
                    <p className="text-red-400 text-sm text-center">{error}</p>
                  )}

                  <button
                    onClick={handleGenerate}
                    className="w-full py-3.5 rounded-xl font-semibold text-sm text-white transition-all active:scale-[0.98]"
                    style={{ background: "#10b981" }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLButtonElement).style.background = "#0d9e6e")
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLButtonElement).style.background = "#10b981")
                    }
                  >
                    Gerar Plano Nutricional
                  </button>
                </div>
              )}

              {/* ── LOADING ── */}
              {step === "loading" && (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <div
                    className="w-10 h-10 rounded-full animate-spin"
                    style={{
                      border: "2px solid rgba(255,255,255,0.06)",
                      borderTopColor: "#10b981",
                    }}
                  />
                  <p className="text-sm" style={{ color: "#a1a1aa" }}>
                    Calculando macros e montando plano...
                  </p>
                  <p className="text-xs" style={{ color: "#52525b" }}>
                    Baseado em RP · Helms · Norton · Aragon
                  </p>
                </div>
              )}

              {/* ── RESULT ── */}
              {step === "result" && plan && (
                <div>
                  {/* TDEE summary */}
                  <div
                    className="px-5 pt-4 pb-3"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-black text-2xl" style={{ color: "#fafafa" }}>
                          {plan.meta_calorica}{" "}
                          <span className="text-sm font-normal" style={{ color: "#52525b" }}>
                            kcal/dia
                          </span>
                        </p>
                        <p className="text-xs font-semibold mt-0.5" style={{ color: surplusColor }}>
                          {surplusLabel}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs" style={{ color: "#52525b" }}>
                          TDEE
                        </p>
                        <p className="font-bold text-sm" style={{ color: "#a1a1aa" }}>
                          {plan.tdee} kcal
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div
                    className="flex shrink-0"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    {(["macros", "refeicoes", "suplementos", "periodizacao"] as const).map((tab) => {
                      const labels = {
                        macros: "Macros",
                        refeicoes: "Refeições",
                        suplementos: "Suplementos",
                        periodizacao: "Periodização",
                      };
                      const active = activeTab === tab;
                      return (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className="flex-1 py-2.5 text-xs font-medium transition-all"
                          style={{
                            color: active ? "#10b981" : "#52525b",
                            borderBottom: active
                              ? "2px solid #10b981"
                              : "2px solid transparent",
                          }}
                        >
                          {labels[tab]}
                        </button>
                      );
                    })}
                  </div>

                  <div className="p-5 space-y-4">
                    {/* MACROS TAB */}
                    {activeTab === "macros" && (
                      <div className="space-y-3">
                        <MacroCard
                          label="Dia de Treino"
                          macros={plan.macros_treino}
                          isTraining={true}
                        />
                        <MacroCard
                          label="Dia de Descanso"
                          macros={plan.macros_descanso}
                          isTraining={false}
                        />
                        <div
                          className="rounded-xl p-4"
                          style={{
                            background: "#141414",
                            border: "1px solid rgba(255,255,255,0.06)",
                          }}
                        >
                          <p
                            className="text-xs font-semibold uppercase tracking-wider mb-1.5"
                            style={{ color: "#52525b" }}
                          >
                            Dica Principal
                          </p>
                          <p className="text-sm leading-relaxed" style={{ color: "#a1a1aa" }}>
                            {plan.dica_principal}
                          </p>
                        </div>
                        <p className="text-xs text-center" style={{ color: "#3f3f46" }}>
                          Fonte: {plan.fonte_metodologica}
                        </p>
                      </div>
                    )}

                    {/* REFEIÇÕES TAB */}
                    {activeTab === "refeicoes" && (
                      <div className="space-y-3">
                        {plan.refeicoes.map((meal, i) => (
                          <div
                            key={i}
                            className="rounded-xl p-4"
                            style={{
                              background: "#141414",
                              border: "1px solid rgba(255,255,255,0.06)",
                            }}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="font-semibold text-sm" style={{ color: "#fafafa" }}>
                                  {meal.nome}
                                </p>
                                <p className="text-xs" style={{ color: "#52525b" }}>
                                  {meal.horario}
                                </p>
                              </div>
                              <p className="text-orange-400 font-bold text-sm">
                                {meal.calorias} kcal
                              </p>
                            </div>
                            <div className="flex gap-3 text-xs mb-3">
                              <span className="text-blue-400">P: {meal.proteina}g</span>
                              <span className="text-orange-400">C: {meal.carboidrato}g</span>
                              <span className="text-yellow-400">G: {meal.gordura}g</span>
                            </div>
                            <div className="space-y-1 mb-2">
                              {meal.exemplos.map((ex, j) => (
                                <p key={j} className="text-xs" style={{ color: "#71717a" }}>
                                  • {ex}
                                </p>
                              ))}
                            </div>
                            {meal.observacao && (
                              <p
                                className="text-xs italic pt-2 mt-2"
                                style={{
                                  color: "#52525b",
                                  borderTop: "1px solid rgba(255,255,255,0.04)",
                                }}
                              >
                                {meal.observacao}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* SUPLEMENTOS TAB */}
                    {activeTab === "suplementos" && (
                      <div className="space-y-3">
                        <p className="text-xs" style={{ color: "#52525b" }}>
                          Apenas suplementos com respaldo científico são incluídos.
                        </p>
                        {plan.suplementos.map((sup, i) => (
                          <div
                            key={i}
                            className="rounded-xl p-4"
                            style={{
                              background: "#141414",
                              border: "1px solid rgba(255,255,255,0.06)",
                            }}
                          >
                            <div className="flex items-start justify-between mb-1">
                              <p className="font-semibold text-sm" style={{ color: "#fafafa" }}>
                                {sup.nome}
                              </p>
                              <span className="flex items-center gap-1.5 text-xs" style={{ color: "#a1a1aa" }}>
                                <span
                                  className="inline-block w-1.5 h-1.5 rounded-full"
                                  style={{ background: evidenceDotColors[sup.evidencia] ?? "#52525b" }}
                                />
                                {sup.evidencia}
                              </span>
                            </div>
                            <p className="text-xs mb-2" style={{ color: "#52525b" }}>
                              {evidenceLabels[sup.evidencia]}
                            </p>
                            <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                              <div>
                                <span style={{ color: "#52525b" }}>Dose: </span>
                                <span style={{ color: "#a1a1aa" }}>{sup.dose}</span>
                              </div>
                              <div>
                                <span style={{ color: "#52525b" }}>Quando: </span>
                                <span style={{ color: "#a1a1aa" }}>{sup.timing}</span>
                              </div>
                            </div>
                            <p className="text-xs italic" style={{ color: "#52525b" }}>
                              {sup.nota}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* PERIODIZAÇÃO TAB */}
                    {activeTab === "periodizacao" && (
                      <div className="space-y-4">
                        <div
                          className="rounded-xl p-4"
                          style={{
                            background: "#141414",
                            border: "1px solid rgba(255,255,255,0.06)",
                          }}
                        >
                          <p
                            className="text-xs font-semibold uppercase tracking-wider mb-2"
                            style={{ color: "#52525b" }}
                          >
                            Periodização Nutricional
                          </p>
                          <p className="text-sm leading-relaxed" style={{ color: "#a1a1aa" }}>
                            {plan.periodizacao_nutricional}
                          </p>
                        </div>

                        {plan.protocolo_refeed && (
                          <div
                            className="rounded-xl p-4"
                            style={{
                              background: "#141414",
                              border: "1px solid rgba(168,85,247,0.15)",
                            }}
                          >
                            <p
                              className="text-xs font-semibold uppercase tracking-wider mb-2"
                              style={{ color: "#a855f7" }}
                            >
                              Protocolo de Refeed
                            </p>
                            <p className="text-sm leading-relaxed" style={{ color: "#a1a1aa" }}>
                              {plan.protocolo_refeed}
                            </p>
                          </div>
                        )}

                        <div
                          className="rounded-xl p-4"
                          style={{
                            background: "rgba(16,185,129,0.08)",
                            border: "1px solid rgba(16,185,129,0.20)",
                          }}
                        >
                          <p
                            className="text-xs font-semibold mb-2"
                            style={{ color: "#10b981" }}
                          >
                            Calorie Cycling (Renaissance Periodization)
                          </p>
                          <div className="space-y-1 text-xs" style={{ color: "#71717a" }}>
                            <p>
                              • Dias de treino:{" "}
                              <span className="text-orange-400 font-semibold">
                                {plan.macros_treino.calories} kcal
                              </span>{" "}
                              — mais carboidratos pré/pós treino
                            </p>
                            <p>
                              • Dias de descanso:{" "}
                              <span style={{ color: "#a1a1aa" }} className="font-semibold">
                                {plan.macros_descanso.calories} kcal
                              </span>{" "}
                              — reduzir carbs, manter proteína
                            </p>
                            <p>
                              • Proteína constante em ambos os dias para maximizar síntese proteica
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => setStep("form")}
                      className="w-full py-2.5 rounded-xl text-sm font-medium transition-all"
                      style={{
                        background: "#141414",
                        border: "1px solid rgba(255,255,255,0.06)",
                        color: "#a1a1aa",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor =
                          "rgba(255,255,255,0.10)";
                        (e.currentTarget as HTMLButtonElement).style.color = "#fafafa";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor =
                          "rgba(255,255,255,0.06)";
                        (e.currentTarget as HTMLButtonElement).style.color = "#a1a1aa";
                      }}
                    >
                      ← Recalcular
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
