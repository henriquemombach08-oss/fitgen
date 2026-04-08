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
  const levelGuidance: Record<string, string> = {
    "Iniciante": "Prefira máquinas guiadas, halteres leves e movimentos bilaterais simples. EVITE: exercícios com barra livre complexos, unilaterais pesados, alta demanda técnica.",
    "Intermediário": "Pode incluir exercícios com barra livre, unilaterais (lunges, dumbbell row), cabos e máquinas. Complexidade técnica moderada.",
    "Avançado": "Todos os exercícios disponíveis. Prefira exercícios com maior tensão no alongamento (stretch-mediated hypertrophy). Pode incluir variações com tempo, unilaterais pesados.",
    "Atleta / Competidor": "Exercícios específicos de bodybuilding ou powerlifting. Priorize ângulos variados, separação muscular, exercícios em pico de contração e em alongamento máximo.",
  };

  const movementPatternGuide = `PRINCÍPIOS DE SUBSTITUIÇÃO POR PADRÃO DE MOVIMENTO:
• Push horizontal (supino, flexão): substitua por outro push horizontal no mesmo plano
• Push vertical (desenvolvimento, Arnold): substitua por outro push vertical ou inclinado
• Pull horizontal (remada): substitua por outro pull horizontal
• Pull vertical (pulldown, barra fixa): substitua por outro pull vertical
• Hip hinge (terra, RDL): substitua por outro hip hinge — NÃO substitua por squat
• Squat (agachamento): substitua por outro squat pattern — NÃO substitua por leg press sozinho sem justificativa
• Isolado de bíceps: substitua por outro curl com tensão similar (pico ou alongamento)
• Isolado de tríceps: substitua por outro tríceps com tensão similar
• Isolado de deltóide lateral: substitua por outra lateral raise variation

POSIÇÃO DE TENSÃO (stretch-mediated hypertrophy):
• Se o exercício original tensiona o músculo no ALONGAMENTO (ex: pec deck, incline curl), prefira um substituto que também tensione no alongamento
• Se tensiona no ENCURTAMENTO (peak contraction), mantenha essa característica`;

  return `Você é um personal trainer certificado (CSCS) com 26 anos de experiência em biomecânica e seleção de exercícios.

EXERCÍCIO A SUBSTITUIR:
• Nome: ${exercise.nome}
• Séries: ${exercise.series}
• Repetições: ${exercise.repeticoes}
• Descanso: ${exercise.descanso}
• Dica original: ${exercise.dica}

PERFIL DO ATLETA:
• Nível: ${formData.level}
• Objetivos: ${formData.goals.join(", ")}
• Equipamento disponível: ${formData.equipment}
• Grupos musculares do treino: ${formData.muscleGroups.join(", ")}

${movementPatternGuide}

NÍVEL — ${formData.level}:
${levelGuidance[formData.level] ?? levelGuidance["Intermediário"]}

EXERCÍCIOS JÁ NO TREINO (NÃO repita nenhum destes):
${allExerciseNames.map((n) => `• ${n}`).join("\n")}

Retorne APENAS JSON válido, sem markdown, sem texto adicional. O campo "en_name" deve ser o nome oficial em inglês para busca de animações.

{
  "nome": "nome do exercício substituto em português",
  "en_name": "official exercise name in English",
  "series": ${exercise.series},
  "repeticoes": "${exercise.repeticoes}",
  "descanso": "${exercise.descanso}",
  "dica": "dica técnica de execução específica para este exercício: mencione ativação muscular, ponto de contração ou amplitude"
}

Regras obrigatórias:
1. Trabalhar o MESMO grupo muscular primário com padrão de movimento equivalente
2. Compatível com o equipamento: ${formData.equipment}
3. NÃO pode ser nenhum dos exercícios já listados acima
4. Manter séries, repetições e descanso idênticos ao original
5. A dica deve ser específica e técnica para o exercício substituto, não genérica`;
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
            "Você é um personal trainer certificado (CSCS) especialista em biomecânica. Sempre responda exclusivamente com JSON válido, sem markdown nem texto adicional.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.65,
      max_tokens: 600,
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
