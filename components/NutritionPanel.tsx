"use client";

import { useState } from "react";
import {
  BodyData, NutritionPlan, ActivityLevel, Sex,
  TrainingTime, MonthlyNutritionPlan,
} from "@/types/nutrition";
import { WorkoutFormData } from "@/types/workout";

interface Props {
  userProfile?: Pick<WorkoutFormData, "level" | "goals" | "equipment">;
}

// ─── Static data ─────────────────────────────────────────────────────────────

const activityOptions: { value: ActivityLevel; label: string; desc: string }[] = [
  { value: "Sedentário",          label: "Sedentário",      desc: "Pouco ou nenhum exercício" },
  { value: "Levemente ativo",     label: "Leve",            desc: "1-3x treino/semana" },
  { value: "Moderadamente ativo", label: "Moderado",        desc: "3-5x treino/semana" },
  { value: "Muito ativo",         label: "Muito ativo",     desc: "6-7x treino/semana" },
  { value: "Extremamente ativo",  label: "Extremo",         desc: "2x/dia ou trabalho físico" },
];

const trainingTimeOptions: { value: TrainingTime; label: string }[] = [
  { value: "Manhã (6h–9h)",       label: "Manhã" },
  { value: "Meio-dia (11h–13h)",  label: "Meio-dia" },
  { value: "Tarde (15h–17h)",     label: "Tarde" },
  { value: "Noite (18h–21h)",     label: "Noite" },
  { value: "Horário variável",    label: "Variável" },
];

type NutritionGoal =
  | "Hipertrofia" | "Força" | "Emagrecimento" | "Recomposição Corporal"
  | "Resistência" | "Potência" | "Contest Prep / Definição" | "Powerlifting";

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

const evidenceDotColors: Record<string, string> = {
  A: "#10b981", B: "#eab308", C: "#71717a",
};
const evidenceLabels: Record<string, string> = {
  A: "Evidência forte", B: "Evidência moderada", C: "Evidência limitada",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function MacroBar({ protein, carbs, fat }: { protein: number; carbs: number; fat: number }) {
  const total = protein * 4 + carbs * 4 + fat * 9;
  if (!total) return null;
  const pPct = Math.round((protein * 4 / total) * 100);
  const cPct = Math.round((carbs * 4 / total) * 100);
  const fPct = 100 - pPct - cPct;
  return (
    <div className="space-y-1">
      <div className="flex h-1 rounded-full overflow-hidden gap-px">
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

function MacroCard({ label, macros, isTraining }: {
  label: string;
  macros: { calories: number; protein: number; carbs: number; fat: number };
  isTraining: boolean;
}) {
  return (
    <div className="rounded-xl p-4" style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)" }}>
      <p className="text-xs font-medium uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color: isTraining ? "#f97316" : "#52525b" }}>
        <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: isTraining ? "#f97316" : "#52525b" }} />
        {label}
      </p>
      <p className="text-2xl font-black mb-1" style={{ color: isTraining ? "#fafafa" : "#a1a1aa" }}>
        {macros.calories} <span className="text-sm font-normal" style={{ color: "#52525b" }}>kcal</span>
      </p>
      <div className="grid grid-cols-3 gap-2 mb-3 text-center">
        <div><p className="text-blue-400 font-bold text-sm">{macros.protein}g</p><p className="text-xs" style={{ color: "#52525b" }}>Proteína</p></div>
        <div><p className="text-orange-400 font-bold text-sm">{macros.carbs}g</p><p className="text-xs" style={{ color: "#52525b" }}>Carbo</p></div>
        <div><p className="text-yellow-400 font-bold text-sm">{macros.fat}g</p><p className="text-xs" style={{ color: "#52525b" }}>Gordura</p></div>
      </div>
      <MacroBar protein={macros.protein} carbs={macros.carbs} fat={macros.fat} />
    </div>
  );
}

// ─── PDF export ───────────────────────────────────────────────────────────────

async function exportNutritionToPDF(
  plan: NutritionPlan,
  bodyData: BodyData,
  goal: string,
  trainingTime: TrainingTime | null,
  monthlyPlan: MonthlyNutritionPlan | null
) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const m = 20;
  let y = 0;

  function checkY(need: number) {
    if (y + need > H - m) { doc.addPage(); y = m; }
  }

  // Header bar
  doc.setFillColor(16, 185, 129);
  doc.rect(0, 0, W, 16, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12); doc.setFont("helvetica", "bold");
  doc.text("FitGen — Plano Nutricional", m, 11);
  doc.setFontSize(8); doc.setFont("helvetica", "normal");
  doc.text(new Date().toLocaleDateString("pt-BR"), W - m, 11, { align: "right" });

  y = 26;

  // Title
  doc.setTextColor(15, 15, 15);
  doc.setFontSize(18); doc.setFont("helvetica", "bold");
  doc.text(goal, m, y); y += 8;

  doc.setFontSize(9); doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(`${bodyData.sex === "M" ? "Masculino" : "Feminino"} · ${bodyData.age} anos · ${bodyData.weight}kg · ${bodyData.height}cm · ${bodyData.activityLevel}${trainingTime ? ` · Treino: ${trainingTime}` : ""}`, m, y); y += 8;

  // TDEE box
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(m, y, W - m * 2, 18, 3, 3, "F");
  doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(15, 15, 15);
  doc.text(`TDEE: ${plan.tdee} kcal`, m + 5, y + 7);
  doc.text(`Meta: ${plan.meta_calorica} kcal`, m + 55, y + 7);
  const adj = plan.surplus_deficit;
  doc.setTextColor(adj > 0 ? 16 : adj < 0 ? 220 : 100, adj > 0 ? 185 : adj < 0 ? 38 : 100, adj > 0 ? 129 : adj < 0 ? 38 : 100);
  doc.text(`${adj > 0 ? "+" : ""}${adj} kcal ${adj > 0 ? "surplus" : adj < 0 ? "déficit" : "manutenção"}`, m + 115, y + 7);
  y += 26;

  // Macros header
  doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(80, 80, 80);
  doc.text("CALORIE CYCLING (Renaissance Periodization)", m, y); y += 6;

  // Training day
  doc.setFillColor(249, 245, 235);
  doc.roundedRect(m, y, (W - m * 2 - 4) / 2, 20, 2, 2, "F");
  doc.setFontSize(7); doc.setTextColor(150, 80, 20); doc.setFont("helvetica", "bold");
  doc.text("DIA DE TREINO", m + 3, y + 5);
  doc.setFontSize(11); doc.setTextColor(15, 15, 15);
  doc.text(`${plan.macros_treino.calories} kcal`, m + 3, y + 12);
  doc.setFontSize(7); doc.setTextColor(100, 100, 100); doc.setFont("helvetica", "normal");
  doc.text(`P: ${plan.macros_treino.protein}g  C: ${plan.macros_treino.carbs}g  G: ${plan.macros_treino.fat}g`, m + 3, y + 17);

  // Rest day
  const rx = m + (W - m * 2) / 2 + 2;
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(rx, y, (W - m * 2 - 4) / 2, 20, 2, 2, "F");
  doc.setFontSize(7); doc.setTextColor(100, 100, 100); doc.setFont("helvetica", "bold");
  doc.text("DIA DE DESCANSO", rx + 3, y + 5);
  doc.setFontSize(11); doc.setTextColor(15, 15, 15);
  doc.text(`${plan.macros_descanso.calories} kcal`, rx + 3, y + 12);
  doc.setFontSize(7); doc.setTextColor(100, 100, 100); doc.setFont("helvetica", "normal");
  doc.text(`P: ${plan.macros_descanso.protein}g  C: ${plan.macros_descanso.carbs}g  G: ${plan.macros_descanso.fat}g`, rx + 3, y + 17);
  y += 28;

  // Meals
  checkY(12);
  doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(80, 80, 80);
  doc.text(`REFEIÇÕES (${plan.refeicoes.length})`, m, y); y += 6;

  plan.refeicoes.forEach((meal) => {
    checkY(22);
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(m, y, W - m * 2, 18, 2, 2, "F");
    doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(15, 15, 15);
    doc.text(meal.nome, m + 3, y + 6);
    doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(100, 100, 100);
    doc.text(meal.horario, m + 3, y + 11);
    doc.setTextColor(249, 115, 22); doc.setFont("helvetica", "bold");
    doc.text(`${meal.calorias} kcal`, W - m - 3, y + 6, { align: "right" });
    doc.setFontSize(7); doc.setTextColor(100, 100, 100); doc.setFont("helvetica", "normal");
    doc.text(`P: ${meal.proteina}g  C: ${meal.carboidrato}g  G: ${meal.gordura}g`, W - m - 3, y + 11, { align: "right" });
    const exText = meal.exemplos.slice(0, 2).join("  ·  ");
    doc.text(exText, m + 3, y + 15.5, { maxWidth: W - m * 2 - 6 });
    y += 22;
  });

  // Supplements
  checkY(12);
  y += 3;
  doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(80, 80, 80);
  doc.text("SUPLEMENTAÇÃO", m, y); y += 6;
  plan.suplementos.forEach((sup) => {
    checkY(10);
    const evColor: [number, number, number] = sup.evidencia === "A" ? [16, 185, 129] : sup.evidencia === "B" ? [234, 179, 8] : [113, 113, 122];
    doc.setFillColor(...evColor);
    doc.circle(m + 2, y - 1, 1.5, "F");
    doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(15, 15, 15);
    doc.text(sup.nome, m + 6, y);
    doc.setFont("helvetica", "normal"); doc.setTextColor(100, 100, 100);
    doc.text(`${sup.dose}  ·  ${sup.timing}`, m + 6, y + 4.5);
    y += 9;
  });

  // Monthly plan
  if (monthlyPlan) {
    doc.addPage(); y = m;
    doc.setFontSize(14); doc.setFont("helvetica", "bold"); doc.setTextColor(15, 15, 15);
    doc.text("Plano Mensal — " + monthlyPlan.nome, m, y); y += 7;
    doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(100, 100, 100);
    const descLines = doc.splitTextToSize(monthlyPlan.descricao, W - m * 2);
    doc.text(descLines, m, y); y += descLines.length * 5 + 6;

    monthlyPlan.semanas.forEach((week) => {
      checkY(30);
      const isSpecial = week.refeed || week.deload;
      doc.setFillColor(isSpecial ? 240 : 250, isSpecial ? 235 : 250, isSpecial ? 250 : 250);
      doc.roundedRect(m, y, W - m * 2, 26, 3, 3, "F");
      if (isSpecial) {
        doc.setFillColor(week.refeed ? 168 : 249, week.refeed ? 85 : 115, week.refeed ? 247 : 22);
        doc.roundedRect(m, y, 4, 26, 2, 2, "F");
      }
      doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(15, 15, 15);
      doc.text(`Semana ${week.semana} — ${week.nome}`, m + 7, y + 7);
      if (week.refeed) { doc.setFillColor(168, 85, 247); doc.roundedRect(m + 100, y + 2, 14, 5, 2, 2, "F"); doc.setTextColor(255,255,255); doc.setFontSize(6); doc.text("REFEED", m + 102, y + 5.5); }
      if (week.deload) { doc.setFillColor(249, 115, 22); doc.roundedRect(m + 116, y + 2, 13, 5, 2, 2, "F"); doc.setTextColor(255,255,255); doc.setFontSize(6); doc.text("DELOAD", m + 118, y + 5.5); }
      doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(100, 100, 100);
      doc.text(`Treino: ${week.calorias_treino} kcal  ·  Descanso: ${week.calorias_descanso} kcal  ·  P: ${week.proteina}g  C: ${week.carboidratos}g  G: ${week.gordura}g`, m + 7, y + 13);
      const obsLines = doc.splitTextToSize(week.observacao, W - m * 2 - 14);
      doc.text(obsLines, m + 7, y + 18);
      y += 30;
    });

    checkY(20);
    y += 3;
    doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(16, 185, 129);
    doc.text("DICA DO MÊS", m, y); y += 5;
    doc.setFont("helvetica", "normal"); doc.setTextColor(60, 60, 60);
    const dicaLines = doc.splitTextToSize(monthlyPlan.dica_mensal, W - m * 2);
    doc.text(dicaLines, m, y); y += dicaLines.length * 5 + 5;
    doc.setFontSize(7); doc.setTextColor(150, 150, 150);
    doc.text("Fonte: " + monthlyPlan.fonte, m, y);
  }

  // Tips box
  checkY(20);
  y += 4;
  doc.setFillColor(240, 253, 250);
  const tipLines = doc.splitTextToSize(plan.dica_principal, W - m * 2 - 10);
  doc.roundedRect(m, y, W - m * 2, tipLines.length * 4.5 + 10, 3, 3, "F");
  doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(16, 185, 129);
  doc.text("DICA PRINCIPAL", m + 4, y + 6);
  doc.setFont("helvetica", "normal"); doc.setTextColor(15, 80, 60);
  doc.text(tipLines, m + 4, y + 11);

  // Footer on last page
  const totalPages = (doc as { internal: { pages: unknown[] } }).internal.pages.length - 1;
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(180, 180, 180);
    doc.text("Gerado por FitGen · " + plan.fonte_metodologica, m, H - 8);
    doc.text(`${p}/${totalPages}`, W - m, H - 8, { align: "right" });
  }

  const fileName = `FitGen_Nutricao_${goal.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
  doc.save(fileName);
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function NutritionPanel({ userProfile }: Props) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"form" | "loading" | "result">("form");
  const [plan, setPlan] = useState<NutritionPlan | null>(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"macros" | "refeicoes" | "suplementos" | "mensal">("macros");
  const [nutritionGoal, setNutritionGoal] = useState<NutritionGoal>(
    (userProfile?.goals?.[0] as NutritionGoal) ?? "Hipertrofia"
  );
  const [trainingTime, setTrainingTime] = useState<TrainingTime>("Tarde (15h–17h)");
  const [monthlyPlan, setMonthlyPlan] = useState<MonthlyNutritionPlan | null>(null);
  const [monthlyLoading, setMonthlyLoading] = useState(false);
  const [monthlyError, setMonthlyError] = useState("");
  const [exportingPDF, setExportingPDF] = useState(false);

  const [body, setBody] = useState<BodyData>({
    weight: 80, height: 175, age: 25, sex: "M", activityLevel: "Moderadamente ativo",
  });

  function handleClose() {
    setOpen(false);
    setTimeout(() => { if (step === "result") return; setStep("form"); setError(""); }, 300);
  }

  async function handleGenerate() {
    setStep("loading"); setError("");
    try {
      const res = await fetch("/api/nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bodyData: body,
          level: userProfile?.level ?? "Intermediário",
          goals: [nutritionGoal],
          equipment: userProfile?.equipment ?? "Academia completa",
          trainingTime,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) { setError(data.error ?? "Erro ao gerar plano."); setStep("form"); return; }
      setPlan(data.plan);
      setMonthlyPlan(null);
      setStep("result");
      setActiveTab("macros");
    } catch {
      setError("Falha na conexão. Tente novamente."); setStep("form");
    }
  }

  async function handleGenerateMonthly() {
    if (!plan) return;
    setMonthlyLoading(true); setMonthlyError("");
    try {
      const res = await fetch("/api/nutrition-monthly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bodyData: body,
          level: userProfile?.level ?? "Intermediário",
          goals: [nutritionGoal],
          basePlan: plan,
          trainingTime,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) { setMonthlyError(data.error ?? "Erro ao gerar plano mensal."); return; }
      setMonthlyPlan(data.monthlyPlan);
    } catch {
      setMonthlyError("Falha na conexão.");
    } finally {
      setMonthlyLoading(false);
    }
  }

  async function handleExportPDF() {
    if (!plan) return;
    setExportingPDF(true);
    try {
      await exportNutritionToPDF(plan, body, nutritionGoal, trainingTime, monthlyPlan);
    } finally {
      setExportingPDF(false);
    }
  }

  // Hydration estimate: 35ml/kg base + 500ml per training day
  const hydrationMl = body.weight * 35 + 500;
  const hydrationL = (hydrationMl / 1000).toFixed(1);

  const surplusLabel = plan
    ? plan.surplus_deficit > 0 ? `+${plan.surplus_deficit} kcal surplus`
    : plan.surplus_deficit < 0 ? `${plan.surplus_deficit} kcal déficit`
    : "Manutenção" : "";

  const surplusColor = plan
    ? plan.surplus_deficit > 0 ? "#10b981"
    : plan.surplus_deficit < 0 ? "#f87171"
    : "#52525b" : "";

  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Plano nutricional" title="Plano nutricional"
        className="w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 active:scale-90"
        style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)", color: "#a1a1aa" }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.10)"; (e.currentTarget as HTMLButtonElement).style.color = "#fafafa"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLButtonElement).style.color = "#a1a1aa"; }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/>
          <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
        </svg>
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 backdrop-blur-sm" style={{ background: "rgba(0,0,0,0.75)" }} onClick={handleClose} />

          <div className="relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
            style={{ background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.06)" }}>
            {/* Accent */}
            <div className="shrink-0" style={{ height: "1px", background: "rgba(16,185,129,0.40)" }} />

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div>
                <h2 className="font-semibold text-sm" style={{ color: "#fafafa" }}>Plano Nutricional</h2>
                <p className="text-xs mt-0.5" style={{ color: "#52525b" }}>
                  {step === "result" && plan
                    ? `${nutritionGoal} · ${trainingTime} · TDEE: ${plan.tdee} kcal`
                    : "Baseado em RP + Eric Helms + Layne Norton"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {step === "result" && plan && (
                  <button
                    onClick={handleExportPDF}
                    disabled={exportingPDF}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-40"
                    style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)", color: "#a1a1aa" }}
                    title="Exportar PDF"
                  >
                    {exportingPDF ? (
                      <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                    )}
                    PDF
                  </button>
                )}
                <button onClick={handleClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-xs transition-colors"
                  style={{ color: "#52525b" }}
                  onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = "#a1a1aa")}
                  onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = "#52525b")}>
                  ✕
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1">

              {/* ── FORM ── */}
              {step === "form" && (
                <div className="p-5 space-y-5">

                  {/* Objetivo */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "#52525b" }}>Objetivo</p>
                    <div className="space-y-1.5">
                      {nutritionGoalOptions.map((opt) => {
                        const sel = nutritionGoal === opt.value;
                        return (
                          <button key={opt.value} type="button" onClick={() => setNutritionGoal(opt.value)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-all"
                            style={{ background: sel ? "rgba(16,185,129,0.08)" : "#141414", border: sel ? "1px solid rgba(16,185,129,0.20)" : "1px solid rgba(255,255,255,0.06)", color: sel ? "#fafafa" : "#a1a1aa" }}>
                            <span>{opt.icon}</span>
                            <div className="flex-1">
                              <p className="text-sm font-medium leading-none">{opt.value}</p>
                              <p className="text-xs mt-0.5" style={{ color: "#52525b" }}>{opt.desc}</p>
                            </div>
                            {sel && <span className="text-xs" style={{ color: "#10b981" }}>✓</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Horário do treino */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "#52525b" }}>Horário do Treino</p>
                    <div className="flex flex-wrap gap-2">
                      {trainingTimeOptions.map((opt) => {
                        const sel = trainingTime === opt.value;
                        return (
                          <button key={opt.value} type="button" onClick={() => setTrainingTime(opt.value)}
                            className="px-3 py-2 rounded-lg text-xs font-medium transition-all"
                            style={{ background: sel ? "rgba(249,115,22,0.10)" : "#141414", border: sel ? "1px solid rgba(249,115,22,0.30)" : "1px solid rgba(255,255,255,0.06)", color: sel ? "#fafafa" : "#a1a1aa" }}>
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sexo */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "#52525b" }}>Sexo Biológico</p>
                    <div className="flex gap-3">
                      {(["M", "F"] as Sex[]).map((s) => {
                        const sel = body.sex === s;
                        return (
                          <button key={s} type="button" onClick={() => setBody(b => ({ ...b, sex: s }))}
                            className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
                            style={{ background: "#141414", border: sel ? "1px solid rgba(249,115,22,0.30)" : "1px solid rgba(255,255,255,0.06)", color: sel ? "#fafafa" : "#a1a1aa" }}>
                            {s === "M" ? "♂ Masculino" : "♀ Feminino"}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Peso / Altura / Idade */}
                  <div className="grid grid-cols-3 gap-3">
                    {([
                      { label: "Peso (kg)", key: "weight" as const, min: 40, max: 200 },
                      { label: "Altura (cm)", key: "height" as const, min: 140, max: 230 },
                      { label: "Idade", key: "age" as const, min: 14, max: 80 },
                    ]).map(({ label, key, min, max }) => (
                      <div key={key} className="space-y-1.5">
                        <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "#52525b" }}>{label}</p>
                        <input
                          type="number" value={body[key]} min={min} max={max}
                          onChange={e => setBody(b => ({ ...b, [key]: Number(e.target.value) }))}
                          className="w-full rounded-xl px-3 py-2.5 text-sm font-bold text-center focus:outline-none transition-colors"
                          style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)", color: "#fafafa" }}
                          onFocus={e => ((e.currentTarget as HTMLInputElement).style.borderColor = "rgba(16,185,129,0.30)")}
                          onBlur={e => ((e.currentTarget as HTMLInputElement).style.borderColor = "rgba(255,255,255,0.06)")}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Nível de atividade */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "#52525b" }}>Nível de Atividade</p>
                    <div className="space-y-1.5">
                      {activityOptions.map((opt) => {
                        const sel = body.activityLevel === opt.value;
                        return (
                          <button key={opt.value} type="button" onClick={() => setBody(b => ({ ...b, activityLevel: opt.value }))}
                            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all"
                            style={{ background: sel ? "rgba(16,185,129,0.08)" : "#141414", border: sel ? "1px solid rgba(16,185,129,0.20)" : "1px solid rgba(255,255,255,0.06)", color: sel ? "#fafafa" : "#a1a1aa" }}>
                            <span className="text-sm font-medium">{opt.label}</span>
                            <span className="text-xs" style={{ color: "#52525b" }}>{opt.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {error && <p className="text-red-400 text-sm text-center">{error}</p>}

                  <button onClick={handleGenerate}
                    className="w-full py-3.5 rounded-xl font-semibold text-sm text-white transition-all active:scale-[0.98]"
                    style={{ background: "#10b981" }}
                    onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = "#0d9e6e")}
                    onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = "#10b981")}>
                    Gerar Plano Nutricional
                  </button>
                </div>
              )}

              {/* ── LOADING ── */}
              {step === "loading" && (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <div className="w-8 h-8 rounded-full animate-spin"
                    style={{ border: "1.5px solid rgba(255,255,255,0.06)", borderTopColor: "#10b981", animationDuration: "0.7s" }} />
                  <p className="text-sm" style={{ color: "#a1a1aa" }}>Calculando macros e montando plano...</p>
                  <p className="text-xs" style={{ color: "#52525b" }}>RP · Helms · Norton · Aragon</p>
                </div>
              )}

              {/* ── RESULT ── */}
              {step === "result" && plan && (
                <div>
                  {/* Summary bar */}
                  <div className="px-5 pt-4 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-black text-2xl" style={{ color: "#fafafa" }}>
                          {plan.meta_calorica} <span className="text-sm font-normal" style={{ color: "#52525b" }}>kcal/dia</span>
                        </p>
                        <p className="text-xs font-semibold mt-0.5" style={{ color: surplusColor }}>{surplusLabel}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs" style={{ color: "#52525b" }}>TDEE</p>
                        <p className="font-bold text-sm" style={{ color: "#a1a1aa" }}>{plan.tdee} kcal</p>
                      </div>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="flex shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    {(["macros", "refeicoes", "suplementos", "mensal"] as const).map((tab) => {
                      const labels = { macros: "Macros", refeicoes: "Refeições", suplementos: "Suplementos", mensal: "Mensal" };
                      const active = activeTab === tab;
                      return (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                          className="flex-1 py-2.5 text-xs font-medium transition-all"
                          style={{ color: active ? "#10b981" : "#52525b", borderBottom: active ? "2px solid #10b981" : "2px solid transparent" }}>
                          {labels[tab]}
                        </button>
                      );
                    })}
                  </div>

                  <div className="p-5 space-y-4">

                    {/* MACROS TAB */}
                    {activeTab === "macros" && (
                      <div className="space-y-3">
                        <MacroCard label="Dia de Treino" macros={plan.macros_treino} isTraining={true} />
                        <MacroCard label="Dia de Descanso" macros={plan.macros_descanso} isTraining={false} />

                        {/* Hydration */}
                        <div className="rounded-xl p-4 flex items-center gap-4" style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)" }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="1.5">
                            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
                          </svg>
                          <div>
                            <p className="text-sm font-bold" style={{ color: "#38bdf8" }}>{hydrationL}L de água/dia</p>
                            <p className="text-xs" style={{ color: "#52525b" }}>
                              Base {Math.round(body.weight * 35 / 1000 * 10) / 10}L + 0.5L dia de treino · Meta mínima diária
                            </p>
                          </div>
                        </div>

                        <div className="rounded-xl p-4" style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)" }}>
                          <p className="text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: "#52525b" }}>Dica Principal</p>
                          <p className="text-sm leading-relaxed" style={{ color: "#a1a1aa" }}>{plan.dica_principal}</p>
                        </div>
                        <p className="text-xs text-center" style={{ color: "#3f3f46" }}>Fonte: {plan.fonte_metodologica}</p>
                      </div>
                    )}

                    {/* REFEIÇÕES TAB */}
                    {activeTab === "refeicoes" && (
                      <div className="space-y-2.5">
                        <p className="text-xs" style={{ color: "#52525b" }}>
                          Timing baseado em: <span style={{ color: "#a1a1aa" }}>{trainingTime}</span>
                        </p>
                        {plan.refeicoes.map((meal, i) => (
                          <div key={i} className="rounded-xl p-4" style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)" }}>
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="font-semibold text-sm" style={{ color: "#fafafa" }}>{meal.nome}</p>
                                <p className="text-xs" style={{ color: "#52525b" }}>{meal.horario}</p>
                              </div>
                              <p className="text-orange-400 font-bold text-sm">{meal.calorias} kcal</p>
                            </div>
                            <div className="flex gap-3 text-xs mb-3">
                              <span className="text-blue-400">P: {meal.proteina}g</span>
                              <span className="text-orange-400">C: {meal.carboidrato}g</span>
                              <span className="text-yellow-400">G: {meal.gordura}g</span>
                            </div>
                            <div className="space-y-0.5 mb-2">
                              {meal.exemplos.map((ex, j) => (
                                <p key={j} className="text-xs" style={{ color: "#71717a" }}>• {ex}</p>
                              ))}
                            </div>
                            {meal.observacao && (
                              <p className="text-xs italic pt-2 mt-2" style={{ color: "#52525b", borderTop: "1px solid rgba(255,255,255,0.04)" }}>{meal.observacao}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* SUPLEMENTOS TAB */}
                    {activeTab === "suplementos" && (
                      <div className="space-y-3">
                        <p className="text-xs" style={{ color: "#52525b" }}>Apenas suplementos com respaldo científico são incluídos.</p>
                        {plan.suplementos.map((sup, i) => (
                          <div key={i} className="rounded-xl p-4" style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)" }}>
                            <div className="flex items-start justify-between mb-1">
                              <p className="font-semibold text-sm" style={{ color: "#fafafa" }}>{sup.nome}</p>
                              <span className="flex items-center gap-1.5 text-xs" style={{ color: "#a1a1aa" }}>
                                <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: evidenceDotColors[sup.evidencia] ?? "#52525b" }} />
                                {sup.evidencia}
                              </span>
                            </div>
                            <p className="text-xs mb-2" style={{ color: "#52525b" }}>{evidenceLabels[sup.evidencia]}</p>
                            <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                              <div><span style={{ color: "#52525b" }}>Dose: </span><span style={{ color: "#a1a1aa" }}>{sup.dose}</span></div>
                              <div><span style={{ color: "#52525b" }}>Quando: </span><span style={{ color: "#a1a1aa" }}>{sup.timing}</span></div>
                            </div>
                            <p className="text-xs italic" style={{ color: "#52525b" }}>{sup.nota}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* MENSAL TAB */}
                    {activeTab === "mensal" && (
                      <div className="space-y-4">
                        {/* Periodization summary */}
                        <div className="rounded-xl p-4" style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)" }}>
                          <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "#52525b" }}>Periodização Nutricional</p>
                          <p className="text-sm leading-relaxed" style={{ color: "#a1a1aa" }}>{plan.periodizacao_nutricional}</p>
                        </div>

                        {plan.protocolo_refeed && (
                          <div className="rounded-xl p-4" style={{ background: "#141414", border: "1px solid rgba(168,85,247,0.15)" }}>
                            <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "#a855f7" }}>Protocolo de Refeed</p>
                            <p className="text-sm leading-relaxed" style={{ color: "#a1a1aa" }}>{plan.protocolo_refeed}</p>
                          </div>
                        )}

                        {/* Calorie cycling reminder */}
                        <div className="rounded-xl p-4" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)" }}>
                          <p className="text-xs font-medium mb-2" style={{ color: "#10b981" }}>Calorie Cycling</p>
                          <div className="space-y-1 text-xs" style={{ color: "#71717a" }}>
                            <p>• Treino: <span className="text-orange-400 font-semibold">{plan.macros_treino.calories} kcal</span> — carbos extras pré/pós</p>
                            <p>• Descanso: <span style={{ color: "#a1a1aa" }} className="font-semibold">{plan.macros_descanso.calories} kcal</span> — reduzir carbs, manter proteína</p>
                          </div>
                        </div>

                        {/* Monthly plan section */}
                        {!monthlyPlan && !monthlyLoading && (
                          <button onClick={handleGenerateMonthly}
                            className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all"
                            style={{ background: "#10b981" }}
                            onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = "#0d9e6e")}
                            onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = "#10b981")}>
                            Gerar Plano Mensal Periodizado
                          </button>
                        )}

                        {monthlyLoading && (
                          <div className="flex items-center justify-center gap-3 py-6">
                            <div className="w-6 h-6 rounded-full animate-spin"
                              style={{ border: "1.5px solid rgba(255,255,255,0.06)", borderTopColor: "#10b981", animationDuration: "0.7s" }} />
                            <p className="text-sm" style={{ color: "#a1a1aa" }}>Gerando plano de 4 semanas...</p>
                          </div>
                        )}

                        {monthlyError && <p className="text-red-400 text-sm text-center">{monthlyError}</p>}

                        {monthlyPlan && (
                          <div className="space-y-3">
                            <div>
                              <p className="font-bold text-sm" style={{ color: "#fafafa" }}>{monthlyPlan.nome}</p>
                              <p className="text-xs mt-0.5" style={{ color: "#52525b" }}>{monthlyPlan.descricao}</p>
                            </div>

                            {monthlyPlan.semanas.map((week) => (
                              <div key={week.semana} className="rounded-xl p-4 relative overflow-hidden"
                                style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)" }}>
                                {/* left accent */}
                                <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-xl"
                                  style={{ background: week.refeed ? "#a855f7" : week.deload ? "#f97316" : "#10b981" }} />
                                <div className="pl-3">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="text-xs font-semibold" style={{ color: "#fafafa" }}>
                                      Semana {week.semana} — {week.nome}
                                    </p>
                                    {week.refeed && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(168,85,247,0.15)", color: "#a855f7" }}>Refeed</span>}
                                    {week.deload && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(249,115,22,0.10)", color: "#f97316" }}>Deload</span>}
                                    {week.ajuste_percentual !== 0 && (
                                      <span className="text-xs" style={{ color: week.ajuste_percentual > 0 ? "#10b981" : "#f87171" }}>
                                        {week.ajuste_percentual > 0 ? "+" : ""}{week.ajuste_percentual}%
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex gap-3 text-xs mb-2">
                                    <span style={{ color: "#f97316" }}>Treino: {week.calorias_treino} kcal</span>
                                    <span style={{ color: "#52525b" }}>Descanso: {week.calorias_descanso} kcal</span>
                                  </div>
                                  <div className="flex gap-3 text-xs mb-2">
                                    <span className="text-blue-400">P: {week.proteina}g</span>
                                    <span className="text-orange-400">C: {week.carboidratos}g</span>
                                    <span className="text-yellow-400">G: {week.gordura}g</span>
                                  </div>
                                  <p className="text-xs" style={{ color: "#52525b" }}>{week.observacao}</p>
                                </div>
                              </div>
                            ))}

                            <div className="rounded-xl p-4" style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)" }}>
                              <p className="text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: "#52525b" }}>Progressão Calórica</p>
                              <p className="text-sm leading-relaxed" style={{ color: "#a1a1aa" }}>{monthlyPlan.progressao_calorica}</p>
                            </div>

                            <div className="rounded-xl p-4" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)" }}>
                              <p className="text-xs font-medium mb-1" style={{ color: "#10b981" }}>Dica do Mês</p>
                              <p className="text-sm leading-relaxed" style={{ color: "#a1a1aa" }}>{monthlyPlan.dica_mensal}</p>
                            </div>

                            <p className="text-xs text-center" style={{ color: "#3f3f46" }}>Fonte: {monthlyPlan.fonte}</p>
                          </div>
                        )}
                      </div>
                    )}

                    <button onClick={() => setStep("form")}
                      className="w-full py-2.5 rounded-xl text-sm font-medium transition-all"
                      style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)", color: "#a1a1aa" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.10)"; (e.currentTarget as HTMLButtonElement).style.color = "#fafafa"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLButtonElement).style.color = "#a1a1aa"; }}>
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
