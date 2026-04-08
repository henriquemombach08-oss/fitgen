export type Sex = "M" | "F";

export type ActivityLevel =
  | "Sedentário"
  | "Levemente ativo"
  | "Moderadamente ativo"
  | "Muito ativo"
  | "Extremamente ativo";

export interface BodyData {
  weight: number; // kg
  height: number; // cm
  age: number;
  sex: Sex;
  activityLevel: ActivityLevel;
}

export interface MacroTargets {
  calories: number;
  protein: number; // g
  carbs: number;   // g
  fat: number;     // g
}

export interface Meal {
  nome: string;         // "Café da manhã", "Pré-treino", "Pós-treino"
  horario: string;      // "07:00", "30-60min antes do treino"
  calorias: number;
  proteina: number;
  carboidrato: number;
  gordura: number;
  exemplos: string[];   // "Ovos + aveia + banana"
  observacao: string;
}

export type EvidenceLevel = "A" | "B" | "C";

export interface Supplement {
  nome: string;
  dose: string;
  timing: string;
  evidencia: EvidenceLevel; // A=forte, B=moderada, C=fraca
  objetivo: string;         // "Hipertrofia", "Força", "Todos"
  nota: string;
}

export interface NutritionPlan {
  tdee: number;
  meta_calorica: number;
  surplus_deficit: number; // positivo = surplus, negativo = déficit
  macros_treino: MacroTargets;
  macros_descanso: MacroTargets;
  refeicoes: Meal[];
  suplementos: Supplement[];
  periodizacao_nutricional: string;
  protocolo_refeed?: string;   // Contest prep / advanced only
  dica_principal: string;
  fonte_metodologica: string;  // RP, Eric Helms, etc.
}

export interface NutritionRequest {
  bodyData: BodyData;
  level: string;
  goals: string[];
  equipment: string;
}

export interface NutritionResponse {
  plan?: NutritionPlan;
  error?: string;
}
