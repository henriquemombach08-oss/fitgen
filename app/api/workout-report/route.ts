import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { Workout, WorkoutFormData, SetLog } from "@/types/workout";

type WorkoutLogs = Record<number, SetLog[]>;

export interface WorkoutReportData {
  resumo: string;
  destaques: string[];
  melhorias: string[];
  dica_principal: string;
}

function buildReportPrompt(
  workout: Workout,
  formData: WorkoutFormData,
  logs: WorkoutLogs
): string {
  const exerciseLines = workout.exercicios
    .map((ex, i) => {
      const sets = logs[i] ?? [];
      const prescricao = `${ex.series} séries × ${ex.repeticoes} | Descanso: ${ex.descanso}`;
      const setLines = sets.map((s, j) => {
        const parts: string[] = [];
        if (s.weight) parts.push(s.weight);
        if (s.reps) parts.push(`${s.reps} reps`);
        if (s.note) parts.push(`"${s.note}"`);
        return parts.length
          ? `   Série ${j + 1}: ${parts.join(", ")}`
          : `   Série ${j + 1}: sem registro`;
      });
      return `${i + 1}. ${ex.nome} (prescrito: ${prescricao})\n${setLines.join("\n")}`;
    })
    .join("\n\n");

  return `Você é um personal trainer experiente analisando a execução de um treino registrado pelo aluno.

Perfil do aluno:
- Nível: ${formData.level}
- Objetivo: ${formData.goals.join(", ")}
- Equipamento: ${formData.equipment}

Treino: "${workout.nome}"
${workout.descricao}

Registro das séries executadas:
${exerciseLines}

Analise os dados e retorne APENAS um JSON válido neste formato:

{
  "resumo": "avaliação geral em 2-3 frases considerando consistência de carga, volume e execução",
  "destaques": ["ponto positivo específico 1", "ponto positivo específico 2"],
  "melhorias": ["sugestão concreta de melhora 1", "sugestão concreta de melhora 2"],
  "dica_principal": "a dica mais importante e acionável para o próximo treino"
}

Regras:
- Mencione exercícios pelo nome quando relevante
- Se cargas ou reps caíram entre séries, aponte como sinal de fadiga ou carga acima do ideal
- Se valores estão consistentes ao longo das séries, elogie o controle
- Se há séries sem registro, considere apenas as registradas
- Ajuste o tom e linguagem ao nível ${formData.level}
- Entre 2 e 4 itens em destaques e melhorias
- Responda em português brasileiro`;
}

export async function POST(request: NextRequest) {
  const client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
  });

  try {
    const body: { workout: Workout; formData: WorkoutFormData; logs: WorkoutLogs } =
      await request.json();
    const { workout, formData, logs } = body;

    if (!workout || !formData || !logs) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }

    const prompt = buildReportPrompt(workout, formData, logs);

    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "Você é um personal trainer especialista. Sempre responda exclusivamente com JSON válido, sem markdown nem texto adicional.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.6,
      max_tokens: 1024,
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "A IA retornou uma resposta inesperada. Tente novamente." },
        { status: 500 }
      );
    }

    const report: WorkoutReportData = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ report });
  } catch (error: unknown) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Não foi possível processar a resposta da IA." },
        { status: 500 }
      );
    }
    const message = error instanceof Error ? error.message : "Erro interno.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
