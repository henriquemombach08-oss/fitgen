import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { Workout, WorkoutFormData } from "@/types/workout";

interface AdjustDifficultyRequest {
  workout: Workout;
  formData: WorkoutFormData;
  direction: "easier" | "harder";
}

function buildAdjustPrompt(
  workout: Workout,
  formData: WorkoutFormData,
  direction: "easier" | "harder"
): string {
  const directionInstructions =
    direction === "easier"
      ? `TORNAR MAIS FÁCIL:
- Reduza 1 série em cada exercício (mínimo 2 séries)
- Aumente o descanso em 20-30% (arredonde para valores legíveis como "60s", "90s", "2min")
- Reduza as repetições para o limite inferior ou abaixo da faixa atual
- Nas dicas, inclua regressões ou versões simplificadas dos exercícios (ex: "use peso menor", "apoio nos joelhos", "amplitude reduzida")
- O observacao_final deve incentivar o aluno e sugerir progressão gradual`
      : `TORNAR MAIS DIFÍCIL:
- Adicione 1 série em cada exercício (máximo 6 séries)
- Reduza o descanso em 20% (arredonde para valores legíveis como "45s", "60s", "90s")
- Aumente as repetições para o limite superior ou acima da faixa atual, ou adicione técnicas avançadas
- Nas dicas, inclua técnicas de intensidade como drop sets, tempo controlado (ex: 3-1-2), rest-pause, ou progressões dos movimentos
- O observacao_final deve desafiar o aluno e mencionar as técnicas aplicadas`;

  const exercisesJson = JSON.stringify(workout.exercicios, null, 2);

  return `Você é um personal trainer especialista. Preciso ajustar a dificuldade de um treino.

Treino atual:
Nome: ${workout.nome}
Descrição: ${workout.descricao}
Duração: ${workout.duracao_estimada}

Exercícios atuais:
${exercisesJson}

Observação atual: ${workout.observacao_final}

Perfil do aluno:
- Nível: ${formData.level}
- Objetivos: ${formData.goals.join(", ")}
- Equipamento: ${formData.equipment}
- Grupos musculares: ${formData.muscleGroups.join(", ")}

Instrução: ${directionInstructions}

Retorne APENAS um objeto JSON válido, sem markdown, sem explicações. Mantenha os mesmos exercícios (apenas ajuste os valores). O JSON deve seguir exatamente este formato:

{
  "exercicios": [
    {
      "nome": "mesmo nome do exercício",
      "series": número_ajustado,
      "repeticoes": "faixa_ajustada",
      "descanso": "tempo_ajustado",
      "dica": "dica atualizada com regressão ou progressão"
    }
  ],
  "observacao_final": "observação atualizada motivando o aluno sobre o novo nível"
}`;
}

export async function POST(request: NextRequest) {
  const client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
  });

  try {
    const body: AdjustDifficultyRequest = await request.json();
    const { workout, formData, direction } = body;

    if (!workout || !formData || !direction) {
      return NextResponse.json(
        { error: "Dados inválidos para ajuste de dificuldade." },
        { status: 400 }
      );
    }

    if (direction !== "easier" && direction !== "harder") {
      return NextResponse.json(
        { error: "Direção inválida. Use 'easier' ou 'harder'." },
        { status: 400 }
      );
    }

    const prompt = buildAdjustPrompt(workout, formData, direction);

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
      temperature: 0.5,
      max_tokens: 2048,
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Resposta da IA sem JSON válido:", raw);
      return NextResponse.json(
        { error: "A IA retornou uma resposta inesperada. Tente novamente." },
        { status: 500 }
      );
    }

    const adjustedData = JSON.parse(jsonMatch[0]);

    // Merge: keep original workout structure, only update exercicios and observacao_final
    const updatedWorkout: Workout = {
      ...workout,
      exercicios: adjustedData.exercicios ?? workout.exercicios,
      observacao_final: adjustedData.observacao_final ?? workout.observacao_final,
    };

    return NextResponse.json({ workout: updatedWorkout });
  } catch (error: unknown) {
    console.error("Erro ao ajustar dificuldade:", error);

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
