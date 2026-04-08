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
  const isAdvanced = ["Avançado", "Atleta / Competidor"].includes(formData.level);
  const isCompetitor = formData.level === "Atleta / Competidor";
  const isBeginner = formData.level === "Iniciante";

  const easierInstructions = isBeginner
    ? `REDUZIR DIFICULDADE (Iniciante):
• Reduza 1 série por exercício (mínimo 2 séries)
• Aumente o descanso em 30% (ex: 60s→90s, 90s→120s)
• Mova as repetições para o limite INFERIOR da faixa (ex: "8-12" → "8-10")
• Nas dicas: sugira versão facilitada — apoio nos joelhos, peso menor, amplitude parcial, máquina em vez de livre
• Mantenha os exercícios — não troque os movimentos
• observacao_final: encoraje com foco em técnica e consistência, não em carga`
    : isAdvanced
    ? `REDUZIR DIFICULDADE (Avançado — Protocolo de Deload):
• DELOAD VERDADEIRO: reduza o volume para 50-60% (ex: 4 séries → 2-3 séries)
• Reduza a intensidade para ~60% 1RM (aumente RIR para 4-5)
• Aumente o descanso para permitir recuperação completa
• REMOVA todas as técnicas de intensificação (drop sets, myo-reps, rest-pause)
• Mantenha os movimentos compostos, mas com carga gerenciável
• observacao_final: explique que o deload é parte obrigatória da periodização — o músculo cresce na recuperação, não apenas no estímulo`
    : `REDUZIR DIFICULDADE (Intermediário):
• Reduza 1 série por exercício (mínimo 2 séries)
• Aumente o descanso em 20-30%
• Mova as repetições para o limite inferior da faixa
• Nas dicas: sugira variações mais acessíveis (haltere em vez de barra, máquina em vez de livre, unilateral em vez de bilateral pesado)
• observacao_final: reforce a importância de dominar a técnica antes de progredir a carga`;

  const harderInstructions = isBeginner
    ? `AUMENTAR DIFICULDADE (Iniciante — Progressão Linear):
• Adicione 1 série por exercício (máximo 3 séries para iniciantes)
• Reduza o descanso em no máximo 15s (não abaixo de 90s)
• Mova as repetições para o limite SUPERIOR (ex: "10-15" → "12-15")
• Nas dicas: instrua a adicionar pequena carga na próxima sessão (2,5-5kg)
• NÃO adicione técnicas avançadas — iniciantes crescem com progressão linear simples
• observacao_final: explique o conceito de sobrecarga progressiva: adicionar 2,5kg por sessão é a ferramenta mais poderosa para iniciantes`
    : isCompetitor
    ? `AUMENTAR DIFICULDADE (Atleta / Competidor — Intensificação Máxima):
• Adicione 1-2 séries por exercício (máximo 6 séries)
• Reduza o descanso em 15-20% nos isolados (compostos pesados mantêm 3-5min)
• Aumente as repetições para o limite superior OU adicione técnica de intensificação obrigatória:
  - Drop Sets: "série principal → drop 25% do peso → continuar até falha"
  - Rest-Pause: "atingir falha → 15-20s → mais 3-5 reps → repetir"
  - Myo-Reps: "15 reps ativação → 5 respirações → mini-séries de 3-5 reps x4"
  - Giant Set: 3 exercícios para o mesmo músculo em sequência
  - Cluster Set: "série pesada dividida em mini-séries de 2-3 reps com 20s pausa"
• Especifique a técnica claramente na dica de cada exercício afetado
• observacao_final: mencione o princípio de overreaching controlado e a necessidade de deload na semana seguinte`
    : isAdvanced
    ? `AUMENTAR DIFICULDADE (Avançado — Técnicas de Intensificação):
• Adicione 1 série por exercício (máximo 5 séries)
• Reduza o descanso em 15% nos isolados
• Adicione técnicas de intensificação nos isolados e finalizadores:
  - Drop Sets (reduzir 20-30% do peso e continuar até falha)
  - Rest-Pause (falha → 15s → mais 3-5 reps)
  - Supersets agonista-antagonista (dois músculos opostos sem descanso)
  - Tempo controlado: excêntrica de 3-4 segundos
• Adicione RIR baixo (1-2 RIR) nas dicas
• observacao_final: explique que o músculo avançado precisa de estresse progressivo crescente para romper a adaptação`
    : `AUMENTAR DIFICULDADE (Intermediário — Sobrecarga Progressiva):
• Adicione 1 série por exercício (máximo 4 séries)
• Reduza o descanso em 15-20%
• Mova as repetições para o limite superior ou levemente acima
• Introduza 1-2 técnicas simples: superset agonista-antagonista ou 1 drop set no último exercício
• Nas dicas: instrua RIR mais baixo (2-3 RIR), maior controle excêntrico (2-3s)
• observacao_final: mencione a importância do registro de cargas para garantir progressão consistente`;

  const exercisesJson = JSON.stringify(workout.exercicios, null, 2);

  return `Você é um personal trainer certificado (CSCS) com 26 anos de experiência. Ajuste a dificuldade deste treino com base em princípios científicos de periodização.

TREINO ATUAL:
Nome: ${workout.nome}
Descrição: ${workout.descricao}
Exercícios:
${exercisesJson}
Observação: ${workout.observacao_final}

PERFIL DO ATLETA:
• Nível: ${formData.level}
• Objetivos: ${formData.goals.join(", ")}
• Equipamento: ${formData.equipment}
• Grupos musculares: ${formData.muscleGroups.join(", ")}

INSTRUÇÃO:
${direction === "easier" ? easierInstructions : harderInstructions}

Retorne APENAS JSON válido, sem markdown, sem texto adicional. Mantenha os mesmos exercícios (apenas ajuste os parâmetros). O campo "en_name" deve ser mantido se existir.

{
  "exercicios": [
    {
      "nome": "mesmo nome do exercício",
      "en_name": "mesmo en_name se existir",
      "series": número_ajustado,
      "repeticoes": "faixa_ajustada",
      "descanso": "tempo_ajustado",
      "dica": "dica técnica atualizada com regressão/progressão específica"
    }
  ],
  "observacao_final": "observação técnica sobre periodização aplicada neste ajuste"
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
            "Você é um personal trainer certificado (CSCS). Sempre responda exclusivamente com JSON válido, sem markdown nem texto adicional.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.5,
      max_tokens: 2500,
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

    const updatedWorkout: Workout = {
      ...workout,
      exercicios: adjustedData.exercicios ?? workout.exercicios,
      observacao_final: adjustedData.observacao_final ?? workout.observacao_final,
    };

    return NextResponse.json({ workout: updatedWorkout });
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
