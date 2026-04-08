import { Metadata } from "next";
import Link from "next/link";
import { getSupabaseServer } from "@/lib/supabase";
import { NutritionPlan, Meal, Supplement, EvidenceLevel } from "@/types/nutrition";

interface SharedNutritionRow {
  id: string;
  plan: NutritionPlan;
  goal: string;
  diet_type: string;
  body_data: { weight: number; height: number; age: number; sex: string };
  training_time: string;
  created_at: string;
}

async function getSharedNutrition(id: string): Promise<SharedNutritionRow | null> {
  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("shared_nutrition")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return data as SharedNutritionRow;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = await getSharedNutrition(id);

  if (!data) {
    return { title: "Plano não encontrado — FitGen" };
  }

  return {
    title: `Plano Nutricional: ${data.goal} — FitGen`,
    description: `Plano nutricional personalizado gerado pelo FitGen. TDEE: ${data.plan.tdee} kcal | Meta: ${data.plan.meta_calorica} kcal`,
    openGraph: {
      title: `Plano Nutricional: ${data.goal} — FitGen`,
      description: `Plano nutricional personalizado gerado pelo FitGen.`,
      siteName: "FitGen",
    },
  };
}

// ── Design tokens (all inline to avoid Tailwind purge issues) ──────────────
const colors = {
  bg: "#080808",
  surface: "#0f0f0f",
  elevated: "#141414",
  border: "rgba(255,255,255,0.06)",
  textPrimary: "#fafafa",
  textSecondary: "#a1a1aa",
  textMuted: "#52525b",
  orange: "#f97316",
  green: "#10b981",
  yellow: "#eab308",
};

function EvidenceDot({ level }: { level: EvidenceLevel }) {
  const dotColor =
    level === "A" ? colors.green : level === "B" ? colors.yellow : colors.textMuted;
  return (
    <span
      style={{
        display: "inline-block",
        width: 8,
        height: 8,
        borderRadius: "50%",
        backgroundColor: dotColor,
        flexShrink: 0,
        marginTop: 4,
      }}
    />
  );
}

function MealCard({ meal }: { meal: Meal }) {
  return (
    <div
      style={{
        backgroundColor: colors.elevated,
        border: `1px solid ${colors.border}`,
        borderRadius: 12,
        padding: "16px",
        marginBottom: 10,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          <p style={{ color: colors.textPrimary, fontWeight: 600, fontSize: 15, margin: 0 }}>
            {meal.nome}
          </p>
          <p style={{ color: colors.textMuted, fontSize: 12, margin: "2px 0 0 0" }}>
            {meal.horario}
          </p>
        </div>
        <span
          style={{
            backgroundColor: "rgba(249,115,22,0.12)",
            color: colors.orange,
            borderRadius: 8,
            padding: "3px 10px",
            fontSize: 13,
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          {meal.calorias} kcal
        </span>
      </div>

      {/* Macros row */}
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        {[
          { label: "P", value: meal.proteina, unit: "g" },
          { label: "C", value: meal.carboidrato, unit: "g" },
          { label: "G", value: meal.gordura, unit: "g" },
        ].map(({ label, value, unit }) => (
          <div
            key={label}
            style={{
              flex: 1,
              backgroundColor: colors.surface,
              borderRadius: 8,
              padding: "6px 8px",
              textAlign: "center",
            }}
          >
            <p style={{ color: colors.textMuted, fontSize: 10, margin: 0, fontWeight: 500 }}>
              {label}
            </p>
            <p style={{ color: colors.textSecondary, fontSize: 13, margin: "2px 0 0 0", fontWeight: 600 }}>
              {value}{unit}
            </p>
          </div>
        ))}
      </div>

      {/* Examples */}
      {meal.exemplos.length > 0 && (
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {meal.exemplos.map((ex, i) => (
            <li
              key={i}
              style={{ color: colors.textSecondary, fontSize: 12, paddingLeft: 12, position: "relative", marginBottom: 2 }}
            >
              <span style={{ position: "absolute", left: 0, color: colors.textMuted }}>•</span>
              {ex}
            </li>
          ))}
        </ul>
      )}

      {meal.observacao && (
        <p style={{ color: colors.textMuted, fontSize: 11, margin: "8px 0 0 0", fontStyle: "italic" }}>
          {meal.observacao}
        </p>
      )}
    </div>
  );
}

function SupplementRow({ supplement }: { supplement: Supplement }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        padding: "10px 0",
        borderBottom: `1px solid ${colors.border}`,
      }}
    >
      <EvidenceDot level={supplement.evidencia} />
      <div style={{ flex: 1 }}>
        <p style={{ color: colors.textPrimary, fontWeight: 600, fontSize: 14, margin: 0 }}>
          {supplement.nome}
        </p>
        <p style={{ color: colors.textSecondary, fontSize: 12, margin: "2px 0 0 0" }}>
          {supplement.dose} · {supplement.timing}
        </p>
        {supplement.nota && (
          <p style={{ color: colors.textMuted, fontSize: 11, margin: "2px 0 0 0", fontStyle: "italic" }}>
            {supplement.nota}
          </p>
        )}
      </div>
      <span
        style={{
          backgroundColor: colors.surface,
          color: colors.textMuted,
          borderRadius: 6,
          padding: "2px 8px",
          fontSize: 11,
          whiteSpace: "nowrap",
        }}
      >
        {supplement.evidencia}
      </span>
    </div>
  );
}

export default async function NutritionSharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getSharedNutrition(id);

  if (!data) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: colors.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 16px",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 48, margin: "0 0 16px 0" }}>🔍</p>
          <h1 style={{ color: colors.textPrimary, fontSize: 20, fontWeight: 700, margin: "0 0 8px 0" }}>
            Plano não encontrado
          </h1>
          <p style={{ color: colors.textMuted, fontSize: 14, margin: "0 0 24px 0" }}>
            Este link pode ter expirado ou ser inválido.
          </p>
          <Link
            href="/"
            style={{
              display: "inline-block",
              padding: "12px 24px",
              borderRadius: 12,
              backgroundColor: colors.orange,
              color: "#fff",
              fontWeight: 700,
              fontSize: 14,
              textDecoration: "none",
            }}
          >
            Criar meu plano →
          </Link>
        </div>
      </div>
    );
  }

  const { plan, goal, diet_type, training_time } = data;
  const surplusDeficit = plan.surplus_deficit;
  const isDeficit = surplusDeficit < 0;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: colors.bg }}>
      <div className="max-w-lg mx-auto px-4 py-10">

        {/* ── Header ── */}
        <header style={{ textAlign: "center", marginBottom: 28 }}>
          <Link href="/" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8 }}>
            {/* Orange square with lightning */}
            <div
              style={{
                width: 32,
                height: 32,
                backgroundColor: colors.orange,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <span style={{ color: colors.textPrimary, fontSize: 24, fontWeight: 900, letterSpacing: "-0.5px" }}>
              Fit<span style={{ color: colors.orange }}>Gen</span>
            </span>
          </Link>
          <p style={{ color: colors.textSecondary, fontSize: 13, margin: "6px 0 0 0" }}>
            Plano Nutricional Compartilhado
          </p>
        </header>

        {/* ── Plan header card ── */}
        <div
          style={{
            backgroundColor: colors.surface,
            borderRadius: 16,
            overflow: "hidden",
            border: `1px solid ${colors.border}`,
            marginBottom: 16,
          }}
        >
          {/* Green top accent */}
          <div style={{ height: 4, backgroundColor: "rgba(16,185,129,0.40)" }} />
          <div style={{ padding: "20px" }}>
            {/* Goal */}
            <h1 style={{ color: colors.textPrimary, fontSize: 20, fontWeight: 700, margin: "0 0 12px 0" }}>
              {goal}
            </h1>

            {/* Badges */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {diet_type && (
                <span
                  style={{
                    backgroundColor: "rgba(16,185,129,0.12)",
                    color: colors.green,
                    borderRadius: 20,
                    padding: "4px 12px",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {diet_type}
                </span>
              )}
              {training_time && (
                <span
                  style={{
                    backgroundColor: "rgba(249,115,22,0.12)",
                    color: colors.orange,
                    borderRadius: 20,
                    padding: "4px 12px",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {training_time}
                </span>
              )}
            </div>

            {/* TDEE / meta / surplus-deficit */}
            <div style={{ display: "flex", gap: 10 }}>
              {[
                { label: "TDEE", value: `${plan.tdee} kcal` },
                { label: "Meta calórica", value: `${plan.meta_calorica} kcal` },
                {
                  label: isDeficit ? "Déficit" : "Surplus",
                  value: `${Math.abs(surplusDeficit)} kcal`,
                  highlight: isDeficit ? colors.green : colors.orange,
                },
              ].map(({ label, value, highlight }) => (
                <div
                  key={label}
                  style={{
                    flex: 1,
                    backgroundColor: colors.elevated,
                    borderRadius: 10,
                    padding: "10px 8px",
                    textAlign: "center",
                  }}
                >
                  <p style={{ color: colors.textMuted, fontSize: 10, margin: 0, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {label}
                  </p>
                  <p style={{ color: highlight ?? colors.textPrimary, fontSize: 14, fontWeight: 700, margin: "4px 0 0 0" }}>
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Calorie cycling ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          {/* Training day */}
          <div
            style={{
              backgroundColor: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <div style={{ height: 3, backgroundColor: colors.orange }} />
            <div style={{ padding: "14px" }}>
              <p style={{ color: colors.textMuted, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px 0" }}>
                Dia de treino
              </p>
              <p style={{ color: colors.orange, fontSize: 20, fontWeight: 800, margin: "0 0 4px 0" }}>
                {plan.macros_treino.calories}
              </p>
              <p style={{ color: colors.textMuted, fontSize: 11, margin: "0 0 8px 0" }}>kcal</p>
              <div style={{ fontSize: 11, color: colors.textSecondary }}>
                <p style={{ margin: "2px 0" }}>P {plan.macros_treino.protein}g</p>
                <p style={{ margin: "2px 0" }}>C {plan.macros_treino.carbs}g</p>
                <p style={{ margin: "2px 0" }}>G {plan.macros_treino.fat}g</p>
              </div>
            </div>
          </div>

          {/* Rest day */}
          <div
            style={{
              backgroundColor: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <div style={{ height: 3, backgroundColor: colors.green }} />
            <div style={{ padding: "14px" }}>
              <p style={{ color: colors.textMuted, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px 0" }}>
                Dia de descanso
              </p>
              <p style={{ color: colors.green, fontSize: 20, fontWeight: 800, margin: "0 0 4px 0" }}>
                {plan.macros_descanso.calories}
              </p>
              <p style={{ color: colors.textMuted, fontSize: 11, margin: "0 0 8px 0" }}>kcal</p>
              <div style={{ fontSize: 11, color: colors.textSecondary }}>
                <p style={{ margin: "2px 0" }}>P {plan.macros_descanso.protein}g</p>
                <p style={{ margin: "2px 0" }}>C {plan.macros_descanso.carbs}g</p>
                <p style={{ margin: "2px 0" }}>G {plan.macros_descanso.fat}g</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Meals ── */}
        {plan.refeicoes.length > 0 && (
          <section style={{ marginBottom: 16 }}>
            <h2
              style={{
                color: colors.textPrimary,
                fontSize: 14,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                margin: "0 0 12px 0",
              }}
            >
              Refeições
            </h2>
            {plan.refeicoes.map((meal, i) => (
              <MealCard key={i} meal={meal} />
            ))}
          </section>
        )}

        {/* ── Supplements ── */}
        {plan.suplementos.length > 0 && (
          <section
            style={{
              backgroundColor: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: 16,
              padding: "16px 20px",
              marginBottom: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <h2
                style={{
                  color: colors.textPrimary,
                  fontSize: 14,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  margin: 0,
                }}
              >
                Suplementos
              </h2>
              {/* Evidence legend */}
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                {(["A", "B", "C"] as EvidenceLevel[]).map((lvl) => (
                  <span key={lvl} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: colors.textMuted }}>
                    <EvidenceDot level={lvl} />
                    {lvl}
                  </span>
                ))}
              </div>
            </div>
            {plan.suplementos.map((sup, i) => (
              <SupplementRow key={i} supplement={sup} />
            ))}
          </section>
        )}

        {/* ── Footer ── */}
        <footer style={{ textAlign: "center", marginTop: 24 }}>
          <p style={{ color: colors.textMuted, fontSize: 12, margin: "0 0 4px 0" }}>
            Gerado por{" "}
            <span style={{ color: colors.orange, fontWeight: 600 }}>FitGen</span>
          </p>
          {plan.fonte_metodologica && (
            <p style={{ color: colors.textMuted, fontSize: 11, margin: "0 0 16px 0" }}>
              Metodologia: {plan.fonte_metodologica}
            </p>
          )}
          <Link
            href="/"
            style={{
              display: "inline-block",
              padding: "12px 28px",
              borderRadius: 12,
              backgroundColor: colors.orange,
              color: "#fff",
              fontWeight: 700,
              fontSize: 14,
              textDecoration: "none",
            }}
          >
            Criar meu plano →
          </Link>
        </footer>

      </div>
    </div>
  );
}
