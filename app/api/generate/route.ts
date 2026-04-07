import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { WorkoutFormData, Workout } from "@/types/workout";

function buildPrompt(data: WorkoutFormData): string {
  const exerciseCount = data.advancedMode ? "entre 8 e 12" : "entre 5 e 8";

  const goalGuide: Record<string, string> = {
    Hipertrofia: "8-12 reps, 60-90s descanso, foco em tensão muscular",
    Força: "3-6 reps, 2-3min descanso, cargas pesadas",
    Resistência: "15-20 reps, 30-45s descanso, cargas leves",
    Emagrecimento: "12-15 reps, 45-60s descanso, circuito metabólico",
    Potência: "3-5 reps explosivas, 2-3min descanso, movimentos olímpicos e pliométricos",
  };

  const levelGuide: Record<string, string> = {
    Iniciante: "movimentos básicos, menos volume, mais descanso",
    Intermediário: "exercícios compostos, volume moderado",
    Avançado: "exercícios avançados, alto volume, técnicas intensas",
  };

  const advancedInstructions = data.advancedMode
    ? `
- MODO AVANÇADO ATIVO: inclua pelo menos 2 técnicas avançadas entre os exercícios, como:
  supersets (indicar na dica), drop sets, rest-pause, tempo controlado (ex: 3-1-2), ou cluster sets.
- Priorize exercícios compostos e variações avançadas.
- O campo "dica" deve mencionar a técnica avançada quando aplicável.`
    : "";

  return `Você é um personal trainer especialista. Crie um treino personalizado com base nos seguintes parâmetros:

- Grupo muscular: ${data.muscleGroup}
- Equipamento disponível: ${data.equipment}
- Tempo disponível: ${data.duration}
- Nível do aluno: ${data.level}
- Objetivo: ${data.goal}
- Modo Avançado: ${data.advancedMode ? "SIM" : "NÃO"}

Retorne APENAS um objeto JSON válido, sem markdown, sem explicações, sem texto antes ou depois. O JSON deve seguir exatamente este formato:

{
  "nome": "nome criativo do treino",
  "descricao": "breve descrição do treino em 1-2 frases",
  "duracao_estimada": "${data.duration}",
  "exercicios": [
    {
      "nome": "nome do exercício",
      "series": 4,
      "repeticoes": "8-12",
      "descanso": "60s",
      "dica": "dica objetiva de execução em 1 frase"
    }
  ],
  "observacao_final": "dica geral importante para este treino específico"
}

Regras:
- Inclua ${exerciseCount} exercícios adequados ao equipamento informado
- Ajuste séries, repetições e descanso ao nível e objetivo
- Use exercícios reais e seguros
- Nível ${data.level}: ${levelGuide[data.level] ?? "volume moderado"}
- Objetivo ${data.goal}: ${goalGuide[data.goal] ?? "volume moderado"}${advancedInstructions}`;
}

export async function POST(request: NextRequest) {
  const client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
  });

  try {
    const body: WorkoutFormData = await request.json();

    const { muscleGroup, equipment, duration, level, goal } = body;
    if (!muscleGroup || !equipment || !duration || !level || !goal) {
      return NextResponse.json(
        { error: "Todos os campos são obrigatórios." },
        { status: 400 }
      );
    }

    const prompt = buildPrompt(body);

    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "Você é um personal trainer especialista. Sempre responda exclusivamente com JSON válido, sem markdown nem texto adicional.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2048,
    });

    const raw = completion.choices[0]?.message?.content ?? "";

    // Extrai JSON mesmo que venha com markdown code blocks
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Resposta da IA sem JSON válido:", raw);
      return NextResponse.json(
        { error: "A IA retornou uma resposta inesperada. Tente novamente." },
        { status: 500 }
      );
    }

    const workout: Workout = JSON.parse(jsonMatch[0]);

    return NextResponse.json({ workout });
  } catch (error: unknown) {
    console.error("Erro ao gerar treino:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Não foi possível processar a resposta da IA. Tente novamente." },
        { status: 500 }
      );
    }

    const message =
      error instanceof Error ? error.message : "Erro interno do servidor.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
