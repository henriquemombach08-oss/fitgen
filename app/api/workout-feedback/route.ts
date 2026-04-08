import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { Workout, WorkoutFormData, SetLog } from "@/types/workout";

type WorkoutLogs = Record<number, SetLog[]>;

interface WorkoutFeedbackRequest {
  workout: Workout;
  logs: WorkoutLogs;
  formData: WorkoutFormData;
}

function buildFeedbackPrompt(
  workout: Workout,
  logs: WorkoutLogs,
  formData: WorkoutFormData
): string {
  const lines: string[] = [];

  lines.push(`TREINO PLANEJADO: ${workout.nome}`);
  lines.push(`Nível: ${formData.level} | Objetivos: ${formData.goals.join(", ")} | Equipamento: ${formData.equipment}`);
  lines.push("");
  lines.push("EXERCÍCIOS PLANEJADOS:");

  workout.exercicios.forEach((ex, i) => {
    lines.push(`${i + 1}. ${ex.nome} — ${ex.series} séries × ${ex.repeticoes} reps | Descanso: ${ex.descanso}`);
  });

  lines.push("");
  lines.push("O QUE FOI REGISTRADO:");

  workout.exercicios.forEach((ex, i) => {
    const exerciseLogs = logs[i] ?? [];
    if (exerciseLogs.length === 0) {
      lines.push(`${i + 1}. ${ex.nome} — nenhuma série registrada`);
    } else {
      const setsDesc = exerciseLogs
        .map((s, si) => {
          const parts: string[] = [`Série ${si + 1}: ${s.reps} reps`];
          if (s.weight && s.weight.trim()) parts.push(`${s.weight} kg`);
          if (s.note && s.note.trim()) parts.push(`(${s.note})`);
          return parts.join(" | ");
        })
        .join("; ");
      lines.push(`${i + 1}. ${ex.nome} — ${setsDesc}`);
    }
  });

  lines.push("");
  lines.push("Com base nesses dados, forneça uma análise construtiva do treino.");

  return lines.join("\n");
}

export async function POST(request: NextRequest) {
  const client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
  });

  try {
    const body: WorkoutFeedbackRequest = await request.json();
    const { workout, logs, formData } = body;

    if (!workout || !logs || !formData) {
      return NextResponse.json(
        { error: "Dados inválidos para análise do treino." },
        { status: 400 }
      );
    }

    const prompt = buildFeedbackPrompt(workout, logs, formData);

    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "Você é um personal trainer experiente. Analise o desempenho do aluno de forma construtiva e objetiva. Seja conciso (máximo 200 palavras).",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.5,
      max_tokens: 400,
    });

    const feedback = completion.choices[0]?.message?.content?.trim() ?? "";

    if (!feedback) {
      return NextResponse.json(
        { error: "A IA não retornou uma análise. Tente novamente." },
        { status: 500 }
      );
    }

    return NextResponse.json({ feedback });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Erro interno do servidor.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
