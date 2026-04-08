"use client";

import { useState } from "react";
import {
  WorkoutFormData,
  MuscleGroup,
  Equipment,
  Duration,
  Level,
  Goal,
} from "@/types/workout";

interface WorkoutFormProps {
  onSubmit: (data: WorkoutFormData) => void;
  isLoading: boolean;
}

const basicMuscleGroups: MuscleGroup[] = [
  "Full Body",
  "Peito", "Costas", "Ombros",
  "Bíceps", "Tríceps", "Braços",
  "Quadríceps", "Posterior", "Pernas",
  "Glúteos", "Core / Abdômen",
];
const advancedMuscleGroups: MuscleGroup[] = [
  ...basicMuscleGroups,
  "Panturrilha", "Trapézio", "Lombar", "Antebraço", "Pescoço",
  "Push (Peito + Ombro + Tríceps)", "Pull (Costas + Bíceps)", "Upper Body",
];

const basicEquipments: Equipment[] = [
  "Academia completa", "Halteres", "Barra + anilhas", "Sem equipamento",
];
const advancedEquipments: Equipment[] = [
  ...basicEquipments, "Cabo / Polia", "Máquinas", "Kettlebell", "Elásticos / Bandas",
];

const basicDurations: Duration[] = ["30 min", "45 min", "60 min", "90 min"];
const advancedDurations: Duration[] = [...basicDurations, "120 min"];

const basicLevels: Level[] = ["Iniciante", "Intermediário", "Avançado"];
const advancedLevels: Level[] = [...basicLevels, "Atleta / Competidor"];

const basicGoals: Goal[] = ["Hipertrofia", "Força", "Resistência", "Emagrecimento"];
const advancedGoals: Goal[] = [
  ...basicGoals,
  "Potência",
  "Recomposição Corporal",
  "Contest Prep / Definição",
  "Powerlifting",
];

// Grupos que se sobrepõem: selecionar um remove os conflitantes
const muscleConflicts: Partial<Record<MuscleGroup, MuscleGroup[]>> = {
  // Grupos genéricos removem os específicos
  "Braços":                        ["Bíceps", "Tríceps", "Antebraço"],
  "Pernas":                        ["Quadríceps", "Posterior", "Panturrilha", "Glúteos"],
  "Full Body":                     ["Peito", "Costas", "Pernas", "Ombros", "Braços", "Bíceps", "Tríceps", "Quadríceps", "Posterior", "Glúteos", "Core / Abdômen", "Panturrilha", "Trapézio", "Lombar", "Antebraço", "Pescoço", "Upper Body", "Push (Peito + Ombro + Tríceps)", "Pull (Costas + Bíceps)"],
  "Upper Body":                    ["Peito", "Costas", "Ombros", "Braços", "Bíceps", "Tríceps", "Antebraço", "Trapézio", "Push (Peito + Ombro + Tríceps)", "Pull (Costas + Bíceps)"],
  "Push (Peito + Ombro + Tríceps)": ["Peito", "Ombros", "Tríceps"],
  "Pull (Costas + Bíceps)":        ["Costas", "Bíceps"],
  // Grupos específicos removem os genéricos que os contêm
  "Bíceps":    ["Braços", "Upper Body", "Full Body", "Pull (Costas + Bíceps)"],
  "Tríceps":   ["Braços", "Upper Body", "Full Body", "Push (Peito + Ombro + Tríceps)"],
  "Antebraço": ["Braços", "Upper Body", "Full Body"],
  "Quadríceps":["Pernas", "Full Body"],
  "Posterior": ["Pernas", "Full Body"],
  "Panturrilha":["Pernas", "Full Body"],
  "Glúteos":   ["Pernas", "Full Body"],
  "Peito":     ["Full Body", "Upper Body", "Push (Peito + Ombro + Tríceps)"],
  "Costas":    ["Full Body", "Upper Body", "Pull (Costas + Bíceps)"],
  "Ombros":    ["Full Body", "Upper Body", "Push (Peito + Ombro + Tríceps)"],
  "Trapézio":  ["Full Body", "Upper Body"],
  "Lombar":    ["Full Body"],
  "Pescoço":   ["Full Body"],
  "Core / Abdômen": ["Full Body"],
};

function resolveMuscleConflicts(opt: MuscleGroup, current: MuscleGroup[]): MuscleGroup[] {
  const toRemove = new Set<string>(muscleConflicts[opt] ?? []);
  return [...current.filter((v) => !toRemove.has(v)), opt];
}

const muscleIcons: Record<MuscleGroup, string> = {
  "Full Body": "⚡",
  Peito: "🫁", Costas: "🔙", Ombros: "🔝",
  Bíceps: "💪", Tríceps: "💪", Braços: "🦾",
  Quadríceps: "🦵", Posterior: "🦵", Pernas: "🦵",
  Glúteos: "🍑", "Core / Abdômen": "🎯",
  Panturrilha: "🦶", Trapézio: "🏔️", Lombar: "↙️", Antebraço: "💪", Pescoço: "🦒",
  "Push (Peito + Ombro + Tríceps)": "🚀",
  "Pull (Costas + Bíceps)": "🧲",
  "Upper Body": "🏆",
};

const goalIcons: Record<Goal, string> = {
  Hipertrofia: "📈",
  Força: "🏋️",
  Resistência: "🏃",
  Emagrecimento: "🔥",
  Potência: "⚡",
  "Recomposição Corporal": "⚖️",
  "Contest Prep / Definição": "🏆",
  Powerlifting: "🥇",
};

// Design tokens
const colors = {
  bgInput: "#141414",
  borderDefault: "rgba(255,255,255,0.06)",
  borderHover: "rgba(255,255,255,0.12)",
  borderActiveOrange: "rgba(249,115,22,0.30)",
  borderActiveViolet: "rgba(139,92,246,0.30)",
  bgActiveOrange: "rgba(249,115,22,0.10)",
  bgActiveViolet: "rgba(139,92,246,0.10)",
  textPrimary: "#fafafa",
  textSecondary: "#a1a1aa",
  textMuted: "#52525b",
  accent: "#f97316",
  accentViolet: "#8b5cf6",
};

function SelectButton({
  selected,
  isAdvOpt,
  onClick,
  children,
}: {
  selected: boolean;
  isAdvOpt: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);

  const getStyle = (): React.CSSProperties => {
    if (selected && isAdvOpt) {
      return {
        background: colors.bgActiveViolet,
        borderColor: colors.borderActiveViolet,
        color: colors.textPrimary,
      };
    }
    if (selected && !isAdvOpt) {
      return {
        background: colors.bgActiveOrange,
        borderColor: colors.borderActiveOrange,
        color: colors.textPrimary,
      };
    }
    if (hovered) {
      return {
        background: colors.bgInput,
        borderColor: colors.borderHover,
        color: colors.textPrimary,
      };
    }
    return {
      background: colors.bgInput,
      borderColor: colors.borderDefault,
      color: colors.textSecondary,
    };
  };

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...getStyle(),
        borderWidth: "1px",
        borderStyle: "solid",
        borderRadius: "8px",
        padding: "6px 12px",
        fontSize: "13px",
        fontWeight: 500,
        transition: "border-color 0.15s, color 0.15s, background 0.15s",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        lineHeight: "1.4",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <label
      style={{
        display: "block",
        fontSize: "11px",
        fontWeight: 500,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: colors.textMuted,
        marginBottom: "8px",
      }}
    >
      {children}
    </label>
  );
}

function SingleSelectGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  icons,
  advanced,
  basicCount,
}: {
  label: string;
  options: T[];
  value: T;
  onChange: (v: T) => void;
  icons?: Record<string, string>;
  advanced?: boolean;
  basicCount?: number;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <SectionLabel>{label}</SectionLabel>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
        {options.map((opt, idx) => {
          const isAdvOpt = advanced && basicCount !== undefined && idx >= basicCount;
          return (
            <SelectButton
              key={opt}
              selected={value === opt}
              isAdvOpt={!!isAdvOpt}
              onClick={() => onChange(opt)}
            >
              {icons?.[opt] && <span>{icons[opt]}</span>}
              {opt}
            </SelectButton>
          );
        })}
      </div>
    </div>
  );
}

function MultiSelectGroup<T extends string>({
  label,
  options,
  values,
  onChange,
  icons,
  advanced,
  basicCount,
  resolveConflicts,
}: {
  label: string;
  options: T[];
  values: T[];
  onChange: (v: T[]) => void;
  icons?: Record<string, string>;
  advanced?: boolean;
  basicCount?: number;
  resolveConflicts?: (opt: T, current: T[]) => T[];
}) {
  function toggle(opt: T) {
    if (values.includes(opt)) {
      if (values.length === 1) return; // mínimo 1 selecionado
      onChange(values.filter((v) => v !== opt));
    } else {
      if (resolveConflicts) {
        onChange(resolveConflicts(opt, values));
      } else {
        onChange([...values, opt]);
      }
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <SectionLabel>{label}</SectionLabel>
        <span style={{ fontSize: "11px", color: colors.textMuted }}>
          {values.length} selecionado{values.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
        {options.map((opt, idx) => {
          const selected = values.includes(opt);
          const isAdvOpt = advanced && basicCount !== undefined && idx >= basicCount;
          return (
            <SelectButton
              key={opt}
              selected={selected}
              isAdvOpt={!!isAdvOpt}
              onClick={() => toggle(opt)}
            >
              {selected && (
                <span style={{ fontSize: "10px", opacity: 0.8 }}>✓</span>
              )}
              {icons?.[opt] && <span>{icons[opt]}</span>}
              {opt}
            </SelectButton>
          );
        })}
      </div>
    </div>
  );
}

export default function WorkoutForm({ onSubmit, isLoading }: WorkoutFormProps) {
  const [form, setForm] = useState<WorkoutFormData>({
    muscleGroups: ["Full Body"],
    equipment: "Academia completa",
    duration: "60 min",
    level: "Intermediário",
    goals: ["Hipertrofia"],
    advancedMode: false,
  });

  function toggleAdvanced() {
    const next = !form.advancedMode;
    setForm((f) => {
      const basicMGs = basicMuscleGroups as readonly string[];
      const basicEqs = basicEquipments as readonly string[];
      const basicDurs = basicDurations as readonly string[];
      const basicGs = basicGoals as readonly string[];
      const basicLvls = basicLevels as readonly string[];
      return {
        ...f,
        advancedMode: next,
        muscleGroups: !next
          ? f.muscleGroups.filter((g) => basicMGs.includes(g)).length > 0
            ? f.muscleGroups.filter((g) => basicMGs.includes(g))
            : ["Full Body"]
          : f.muscleGroups,
        equipment: !next && !basicEqs.includes(f.equipment) ? "Academia completa" : f.equipment,
        duration: !next && !basicDurs.includes(f.duration) ? "60 min" : f.duration,
        level: !next && !basicLvls.includes(f.level) ? "Avançado" : f.level,
        goals: !next
          ? f.goals.filter((g) => basicGs.includes(g)).length > 0
            ? f.goals.filter((g) => basicGs.includes(g))
            : ["Hipertrofia"]
          : f.goals,
      };
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(form);
  }

  const muscleGroupOptions = form.advancedMode ? advancedMuscleGroups : basicMuscleGroups;
  const equipmentOptions = form.advancedMode ? advancedEquipments : basicEquipments;
  const durationOptions = form.advancedMode ? advancedDurations : basicDurations;
  const levelOptions = form.advancedMode ? advancedLevels : basicLevels;
  const goalOptions = form.advancedMode ? advancedGoals : basicGoals;

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Toggle Modo Avançado */}
      <AdvancedToggle active={form.advancedMode} onToggle={toggleAdvanced} />

      <MultiSelectGroup
        label="Grupo Muscular"
        options={muscleGroupOptions}
        values={form.muscleGroups}
        onChange={(v) => setForm((f) => ({ ...f, muscleGroups: v }))}
        icons={muscleIcons}
        advanced={form.advancedMode}
        basicCount={basicMuscleGroups.length}
        resolveConflicts={resolveMuscleConflicts}
      />

      <SingleSelectGroup
        label="Equipamento"
        options={equipmentOptions}
        value={form.equipment}
        onChange={(v) => setForm((f) => ({ ...f, equipment: v }))}
        advanced={form.advancedMode}
        basicCount={basicEquipments.length}
      />

      <SingleSelectGroup
        label="Tempo Disponível"
        options={durationOptions}
        value={form.duration}
        onChange={(v) => setForm((f) => ({ ...f, duration: v }))}
        advanced={form.advancedMode}
        basicCount={basicDurations.length}
      />

      <SingleSelectGroup
        label="Nível"
        options={levelOptions}
        value={form.level}
        onChange={(v) => setForm((f) => ({ ...f, level: v }))}
        advanced={form.advancedMode}
        basicCount={basicLevels.length}
      />

      <MultiSelectGroup
        label="Objetivo"
        options={goalOptions}
        values={form.goals}
        onChange={(v) => setForm((f) => ({ ...f, goals: v }))}
        icons={goalIcons}
        advanced={form.advancedMode}
        basicCount={basicGoals.length}
      />

      {/* Linha de status Modo Avançado */}
      {form.advancedMode && (
        <p style={{ fontSize: "12px", color: colors.accentViolet, margin: 0, lineHeight: 1.5 }}>
          Modo Avançado ativo — desbloqueados: Atleta / Competidor, Powerlifting, Contest Prep e técnicas como drop sets e myo-reps.
        </p>
      )}

      {/* Botão de submit */}
      <SubmitButton isLoading={isLoading} advancedMode={form.advancedMode} />
    </form>
  );
}

function AdvancedToggle({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  const [hovered, setHovered] = useState(false);

  const borderColor = active
    ? colors.borderActiveViolet
    : hovered
    ? colors.borderHover
    : colors.borderDefault;

  return (
    <button
      type="button"
      onClick={onToggle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 14px",
        borderRadius: "10px",
        background: colors.bgInput,
        border: `1px solid ${borderColor}`,
        transition: "border-color 0.15s",
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        <span
          style={{
            fontSize: "13px",
            fontWeight: 500,
            color: active ? colors.accentViolet : colors.textSecondary,
            lineHeight: 1,
          }}
        >
          Modo Avançado
        </span>
        <span style={{ fontSize: "11px", color: colors.textMuted, lineHeight: 1.4 }}>
          {active
            ? "Grupos extras, técnicas avançadas e mais"
            : "Desbloqueie grupos musculares e técnicas extras"}
        </span>
      </div>

      {/* Toggle pill */}
      <div
        style={{
          position: "relative",
          width: "36px",
          height: "20px",
          borderRadius: "10px",
          background: active ? colors.accentViolet : "rgba(255,255,255,0.08)",
          transition: "background 0.2s",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "3px",
            left: active ? "19px" : "3px",
            width: "14px",
            height: "14px",
            borderRadius: "50%",
            background: "#fff",
            transition: "left 0.2s",
            boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
          }}
        />
      </div>
    </button>
  );
}

function SubmitButton({ isLoading, advancedMode }: { isLoading: boolean; advancedMode: boolean }) {
  const [hovered, setHovered] = useState(false);

  const bgColor = advancedMode
    ? hovered ? "#6d28d9" : "#7c3aed"
    : hovered ? "#ea6c0a" : "#f97316";

  return (
    <button
      type="submit"
      disabled={isLoading}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%",
        padding: "14px",
        borderRadius: "10px",
        background: bgColor,
        border: "none",
        color: "#fff",
        fontSize: "14px",
        fontWeight: 700,
        letterSpacing: "0.02em",
        cursor: isLoading ? "not-allowed" : "pointer",
        opacity: isLoading ? 0.5 : 1,
        transition: "background 0.15s, opacity 0.15s, transform 0.1s",
        transform: hovered && !isLoading ? "scale(0.995)" : "scale(1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
      }}
    >
      {isLoading ? (
        <>
          <svg
            style={{ width: "16px", height: "16px", animation: "spin 1s linear infinite" }}
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Gerando treino...
        </>
      ) : advancedMode ? (
        "Gerar Treino Avançado"
      ) : (
        "Gerar Treino"
      )}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </button>
  );
}
