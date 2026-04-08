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

const evidenceColors: Record<string, string> = {
  A: "text-green-400 bg-green-500/10 border-green-500/30",
  B: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  C: "text-gray-400 bg-gray-500/10 border-gray-600/30",
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
      <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
        <div className="bg-blue-500 rounded-l-full" style={{ width: `${pPct}%` }} />
        <div className="bg-orange-400" style={{ width: `${cPct}%` }} />
        <div className="bg-yellow-500 rounded-r-full" style={{ width: `${fPct}%` }} />
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span><span className="text-blue-400">P</span> {pPct}%</span>
        <span><span className="text-orange-400">C</span> {cPct}%</span>
        <span><span className="text-yellow-400">G</span> {fPct}%</span>
      </div>
    </div>
  );
}

function MacroCard({ label, macros, isTraining }: { label: string; macros: { calories: number; protein: number; carbs: number; fat: number }; isTraining: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${isTraining ? "border-orange-500/30 bg-orange-500/5" : "border-gray-700 bg-gray-800/40"}`}>
      <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${isTraining ? "text-orange-400" : "text-gray-400"}`}>
        {isTraining ? "⚡ " : "💤 "}{label}
      </p>
      <p className={`text-2xl font-black mb-1 ${isTraining ? "text-orange-400" : "text-gray-300"}`}>
        {macros.calories} <span className="text-sm font-normal">kcal</span>
      </p>
      <div className="grid grid-cols-3 gap-2 mb-3 text-center">
        <div>
          <p className="text-blue-400 font-bold text-sm">{macros.protein}g</p>
          <p className="text-gray-600 text-xs">Proteína</p>
        </div>
        <div>
          <p className="text-orange-400 font-bold text-sm">{macros.carbs}g</p>
          <p className="text-gray-600 text-xs">Carbo</p>
        </div>
        <div>
          <p className="text-yellow-400 font-bold text-sm">{macros.fat}g</p>
          <p className="text-gray-600 text-xs">Gordura</p>
        </div>
      </div>
      <MacroBar protein={macros.protein} carbs={macros.carbs} fat={macros.fat} />
    </div>
  );
}

export default function NutritionPanel({ userProfile }: Props) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"form" | "loading" | "result">("form");
  const [plan, setPlan] = useState<NutritionPlan | null>(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"macros" | "refeicoes" | "suplementos" | "periodizacao">("macros");

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
          goals: userProfile?.goals ?? ["Hipertrofia"],
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
      ? "text-green-400"
      : plan.surplus_deficit < 0
      ? "text-red-400"
      : "text-gray-400"
    : "";

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Plano nutricional"
        title="Plano nutricional"
        className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-700 bg-gray-800 text-gray-400 hover:border-orange-500/40 hover:text-orange-400 transition-all duration-200 active:scale-90 text-base"
      >
        🥗
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />

          <div className="relative w-full max-w-lg bg-gray-950 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Accent */}
            <div className="h-1 bg-gradient-to-r from-green-600 via-emerald-400 to-green-600 shrink-0" />

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 shrink-0">
              <div>
                <h2 className="text-white font-bold text-base">🥗 Plano Nutricional</h2>
                <p className="text-gray-500 text-xs">
                  {step === "result" && plan
                    ? `TDEE: ${plan.tdee} kcal · Meta: ${plan.meta_calorica} kcal`
                    : "Baseado em RP + Eric Helms + Layne Norton"}
                </p>
              </div>
              <button onClick={handleClose} className="text-gray-500 hover:text-gray-300 text-lg transition-colors">✕</button>
            </div>

            <div className="overflow-y-auto flex-1">
              {/* ── FORM ── */}
              {step === "form" && (
                <div className="p-5 space-y-5">
                  {userProfile && (
                    <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 px-4 py-3">
                      <p className="text-xs text-orange-400 font-semibold">Perfil de treino detectado</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {userProfile.level} · {userProfile.goals.join(", ")}
                      </p>
                    </div>
                  )}

                  {/* Sexo */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Sexo Biológico</label>
                    <div className="flex gap-3">
                      {(["M", "F"] as Sex[]).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setBody((b) => ({ ...b, sex: s }))}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                            body.sex === s
                              ? "bg-orange-500 border-orange-500 text-white"
                              : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600"
                          }`}
                        >
                          {s === "M" ? "♂ Masculino" : "♀ Feminino"}
                        </button>
                      ))}
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
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</label>
                        <input
                          type="number"
                          value={body[key]}
                          min={min}
                          max={max}
                          onChange={(e) => setBody((b) => ({ ...b, [key]: Number(e.target.value) }))}
                          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/50 text-center font-bold"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Nível de atividade */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Nível de Atividade</label>
                    <div className="space-y-2">
                      {activityOptions.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setBody((b) => ({ ...b, activityLevel: opt.value }))}
                          className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-left transition-all ${
                            body.activityLevel === opt.value
                              ? "bg-orange-500/10 border-orange-500/40 text-white"
                              : "bg-gray-800/60 border-gray-700 text-gray-400 hover:border-gray-600"
                          }`}
                        >
                          <span className="text-sm font-medium">{opt.label}</span>
                          <span className="text-xs text-gray-500">{opt.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {error && (
                    <p className="text-red-400 text-sm text-center">{error}</p>
                  )}

                  <button
                    onClick={handleGenerate}
                    className="w-full py-4 rounded-xl font-bold text-base bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white shadow-lg shadow-green-500/20 transition-all active:scale-[0.98]"
                  >
                    🥗 Gerar Plano Nutricional
                  </button>
                </div>
              )}

              {/* ── LOADING ── */}
              {step === "loading" && (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <div className="w-12 h-12 rounded-full border-2 border-green-500 border-t-transparent animate-spin" />
                  <p className="text-gray-400 text-sm">Calculando macros e montando plano...</p>
                  <p className="text-gray-600 text-xs">Baseado em RP · Helms · Norton · Aragon</p>
                </div>
              )}

              {/* ── RESULT ── */}
              {step === "result" && plan && (
                <div>
                  {/* TDEE summary */}
                  <div className="px-5 pt-4 pb-3 border-b border-gray-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-black text-2xl">{plan.meta_calorica} <span className="text-sm font-normal text-gray-400">kcal/dia</span></p>
                        <p className={`text-xs font-semibold mt-0.5 ${surplusColor}`}>{surplusLabel}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-500 text-xs">TDEE</p>
                        <p className="text-gray-300 font-bold">{plan.tdee} kcal</p>
                      </div>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="flex border-b border-gray-800 shrink-0">
                    {(["macros", "refeicoes", "suplementos", "periodizacao"] as const).map((tab) => {
                      const labels = { macros: "Macros", refeicoes: "Refeições", suplementos: "Suplementos", periodizacao: "Periodização" };
                      return (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={`flex-1 py-2.5 text-xs font-semibold transition-all border-b-2 ${
                            activeTab === tab
                              ? "border-green-500 text-green-400"
                              : "border-transparent text-gray-500 hover:text-gray-400"
                          }`}
                        >
                          {labels[tab]}
                        </button>
                      );
                    })}
                  </div>

                  <div className="p-5 space-y-4">
                    {/* MACROS TAB */}
                    {activeTab === "macros" && (
                      <div className="space-y-4">
                        <MacroCard label="Dia de Treino" macros={plan.macros_treino} isTraining={true} />
                        <MacroCard label="Dia de Descanso" macros={plan.macros_descanso} isTraining={false} />
                        <div className="rounded-xl border border-gray-700 bg-gray-800/40 p-4">
                          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Dica Principal</p>
                          <p className="text-sm text-gray-300 leading-relaxed">{plan.dica_principal}</p>
                        </div>
                        <p className="text-xs text-gray-600 text-center">Fonte: {plan.fonte_metodologica}</p>
                      </div>
                    )}

                    {/* REFEIÇÕES TAB */}
                    {activeTab === "refeicoes" && (
                      <div className="space-y-3">
                        {plan.refeicoes.map((meal, i) => (
                          <div key={i} className="rounded-xl border border-gray-700 bg-gray-800/40 p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="text-white font-bold text-sm">{meal.nome}</p>
                                <p className="text-gray-500 text-xs">{meal.horario}</p>
                              </div>
                              <p className="text-orange-400 font-bold text-sm">{meal.calorias} kcal</p>
                            </div>
                            <div className="flex gap-3 text-xs mb-3">
                              <span className="text-blue-400">P: {meal.proteina}g</span>
                              <span className="text-orange-400">C: {meal.carboidrato}g</span>
                              <span className="text-yellow-400">G: {meal.gordura}g</span>
                            </div>
                            <div className="space-y-1 mb-2">
                              {meal.exemplos.map((ex, j) => (
                                <p key={j} className="text-xs text-gray-400">• {ex}</p>
                              ))}
                            </div>
                            {meal.observacao && (
                              <p className="text-xs text-gray-500 italic border-t border-gray-700/50 pt-2 mt-2">{meal.observacao}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* SUPLEMENTOS TAB */}
                    {activeTab === "suplementos" && (
                      <div className="space-y-3">
                        <p className="text-xs text-gray-500">Apenas suplementos com respaldo científico são incluídos.</p>
                        {plan.suplementos.map((sup, i) => (
                          <div key={i} className="rounded-xl border border-gray-700 bg-gray-800/40 p-4">
                            <div className="flex items-start justify-between mb-1">
                              <p className="text-white font-bold text-sm">{sup.nome}</p>
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${evidenceColors[sup.evidencia]}`}>
                                {sup.evidencia}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mb-2">{evidenceLabels[sup.evidencia]}</p>
                            <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                              <div>
                                <span className="text-gray-500">Dose: </span>
                                <span className="text-gray-300">{sup.dose}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Quando: </span>
                                <span className="text-gray-300">{sup.timing}</span>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 italic">{sup.nota}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* PERIODIZAÇÃO TAB */}
                    {activeTab === "periodizacao" && (
                      <div className="space-y-4">
                        <div className="rounded-xl border border-gray-700 bg-gray-800/40 p-4">
                          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">Periodização Nutricional</p>
                          <p className="text-sm text-gray-300 leading-relaxed">{plan.periodizacao_nutricional}</p>
                        </div>

                        {plan.protocolo_refeed && (
                          <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-4">
                            <p className="text-xs text-purple-400 font-semibold uppercase tracking-wider mb-2">Protocolo de Refeed</p>
                            <p className="text-sm text-gray-300 leading-relaxed">{plan.protocolo_refeed}</p>
                          </div>
                        )}

                        <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
                          <p className="text-xs text-green-400 font-semibold mb-1">Calorie Cycling (Renaissance Periodization)</p>
                          <div className="space-y-1 text-xs text-gray-400">
                            <p>• Dias de treino: <span className="text-orange-400 font-semibold">{plan.macros_treino.calories} kcal</span> — mais carboidratos pré/pós treino</p>
                            <p>• Dias de descanso: <span className="text-gray-300 font-semibold">{plan.macros_descanso.calories} kcal</span> — reduzir carbs, manter proteína</p>
                            <p>• Proteína constante em ambos os dias para maximizar síntese proteica</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => setStep("form")}
                      className="w-full py-3 rounded-xl text-sm font-semibold border border-gray-700 bg-gray-800 hover:border-gray-600 text-gray-400 hover:text-gray-300 transition-all"
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
