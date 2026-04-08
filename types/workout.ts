export type MuscleGroup =
  | "Peito"
  | "Costas"
  | "Pernas"
  | "Ombros"
  | "Braços"
  | "Full Body"
  | "Glúteos"
  | "Core / Abdômen"
  | "Panturrilha"
  | "Push (Peito + Ombro + Tríceps)"
  | "Pull (Costas + Bíceps)"
  | "Upper Body"
  | "Trapézio"
  | "Lombar"
  | "Antebraço"
  | "Pescoço";

export type Equipment =
  | "Academia completa"
  | "Halteres"
  | "Barra + anilhas"
  | "Sem equipamento"
  | "Cabo / Polia"
  | "Máquinas"
  | "Kettlebell";

export type Duration = "30 min" | "45 min" | "60 min" | "90 min" | "120 min";

export type Level = "Iniciante" | "Intermediário" | "Avançado";

export type Goal =
  | "Hipertrofia"
  | "Força"
  | "Resistência"
  | "Emagrecimento"
  | "Potência";

export interface WorkoutFormData {
  muscleGroups: MuscleGroup[];
  equipment: Equipment;
  duration: Duration;
  level: Level;
  goals: Goal[];
  advancedMode: boolean;
}

export interface Exercise {
  nome: string;
  en_name?: string;
  series: number;
  repeticoes: string;
  descanso: string;
  dica: string;
}

export interface Workout {
  nome: string;
  descricao: string;
  duracao_estimada: string;
  exercicios: Exercise[];
  observacao_final: string;
}

export interface GenerateResponse {
  workout?: Workout;
  error?: string;
}

export interface SavedWorkout {
  id: string;
  workout: Workout;
  formData: WorkoutFormData;
  createdAt: string;
  isFavorite: boolean;
}

export interface SetLog {
  weight: string;
  reps: string;
  note: string;
}

export interface WorkoutReportData {
  resumo: string;
  destaques: string[];
  melhorias: string[];
  dica_principal: string;
}
