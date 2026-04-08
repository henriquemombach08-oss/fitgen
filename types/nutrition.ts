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

export type DietType =
  | "Onívoro"
  | "Vegetariano"
  | "Vegano"
  | "Keto / Low-carb"
  | "Paleo"
  | "Mediterrâneo"
  | "Low Carb";

export interface NutritionRequest {
  bodyData: BodyData;
  level: string;
  goals: string[];
  equipment: string;
  trainingTime?: TrainingTime;
  dietType?: DietType;
}

export interface ReplaceMealRequest {
  meal: Meal;
  mealIndex: number;
  plan: NutritionPlan;
  goals: string[];
  level: string;
  dietType?: DietType;
  trainingTime?: TrainingTime;
}

export interface ReplaceMealResponse {
  meal?: Meal;
  error?: string;
}

export interface NutritionResponse {
  plan?: NutritionPlan;
  error?: string;
}

export type TrainingTime =
  | "Manhã (6h–9h)"
  | "Meio-dia (11h–13h)"
  | "Tarde (15h–17h)"
  | "Noite (18h–21h)"
  | "Horário variável";

export interface WeekNutrition {
  semana: number;
  nome: string;           // "Semana de Acumulação", "Semana de Intensificação"
  foco: string;           // descrição do foco nutricional desta semana
  calorias_treino: number;
  calorias_descanso: number;
  proteina: number;       // g/dia
  carboidratos: number;   // g/dia
  gordura: number;        // g/dia
  ajuste_percentual: number; // % em relação à semana base (+5%, -10%, etc)
  refeed: boolean;
  deload: boolean;
  observacao: string;
}

export interface MonthlyNutritionPlan {
  nome: string;
  descricao: string;
  semanas: WeekNutrition[];
  progressao_calorica: string;  // descrição da progressão ao longo do mês
  dica_mensal: string;
  fonte: string;
}

export interface MonthlyNutritionRequest {
  bodyData: BodyData;
  level: string;
  goals: string[];
  basePlan: NutritionPlan;      // plano base já gerado
  trainingTime?: TrainingTime;
  dietType?: DietType;
}
