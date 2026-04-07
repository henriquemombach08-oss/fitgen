import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { Exercise, WorkoutFormData } from "@/types/workout";

interface ReplaceExerciseRequest {
  exercise: Exercise;
  formData: WorkoutFormData;
  allExerciseNames: string[];
}

function buildReplacePrompt(
  exercise: Exercise,
  formData: WorkoutFormData,
  allExerciseNames: string[]
): string {
  return `Você é um personal trainer especialista. Preciso substituir um exercício por uma alternativa equivalente.

Exercício a substituir: ${exercise.nome}
Séries atuais: ${exercise.series}
Repetições atuais: ${exercise.repeticoes}
Descanso atual: ${exercise.descanso}

Contexto do treino:
- Grupos musculares: ${formData.muscleGroups.join(", ")}
- Equipamento disponível: ${formData.equipment}
- Nível do aluno: ${formData.level}
- Objetivos: ${formData.goals.join(", ")}

Exercícios já presentes no treino (NÃO repita nenhum destes):
${allExerciseNames.map((n) => `- ${n}`).join("\n")}

Retorne APENAS um objeto JSON válido, sem markdown, sem explicações. O JSON deve seguir exatamente este formato:

{
  "nome": "nome do exercício substituto",
  "series": ${exercise.series},
  "repeticoes": "${exercise.repeticoes}",
  "descanso": "${exercise.descanso}",
  "dica": "dica objetiva de execução em 1 frase"
}

Regras:
- O exercício substituto deve trabalhar o mesmo grupo muscular que o original
- Deve ser compatível com o equipamento disponível: ${formData.equipment}
- NÃO pode ser nenhum dos exercícios já listados acima
- Mantenha séries, repetições e descanso similares ao original
- A dica deve ser específica para o exercício substituto`;
}

export async function POST(request: NextRequest) {
  const client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
  });

  try {
    const body: ReplaceExerciseRequest = await request.json();
    const { exercise, formData, allExerciseNames } = body;

    if (!exercise || !formData || !allExerciseNames) {
      return NextResponse.json(
        { error: "Dados inválidos para substituição." },
        { status: 400 }
      );
    }

    const prompt = buildReplacePrompt(exercise, formData, allExerciseNames);

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
      max_tokens: 512,
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

    const newExercise: Exercise = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ exercise: newExercise });
  } catch (error: unknown) {
    console.error("Erro ao substituir exercício:", error);

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
