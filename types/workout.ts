export type MuscleGroup =
  | "Peito"
  | "Costas"
  | "Pernas"
  | "Ombros"
  | "Braços"
  | "Full Body";

export type Equipment =
  | "Academia completa"
  | "Halteres"
  | "Barra + anilhas"
  | "Sem equipamento";

export type Duration = "30 min" | "45 min" | "60 min" | "90 min";

export type Level = "Iniciante" | "Intermediário" | "Avançado";

export type Goal =
  | "Hipertrofia"
  | "Força"
  | "Resistência"
  | "Emagrecimento";

export interface WorkoutFormData {
  muscleGroup: MuscleGroup;
  equipment: Equipment;
  duration: Duration;
  level: Level;
  goal: Goal;
}

export interface Exercise {
  nome: string;
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
