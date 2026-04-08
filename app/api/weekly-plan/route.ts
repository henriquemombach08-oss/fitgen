import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { WeeklyPlan } from "@/types/workout";

interface WeeklyPlanRequest {
  level: string;
  goals: string[];
  equipment: string;
  daysPerWeek: number;
}

function buildPrompt(data: WeeklyPlanRequest): string {
  const splitGuide: Record<number, string> = {
    3: "Full Body (3x por semana, segunda/quarta/sexta ou similar, os outros dias são descanso)",
    4: "Upper/Lower Split (2x upper body + 2x lower body, com 3 dias de descanso distribuídos)",
    5: "Push/Pull/Legs + 2 dias extras (ex: Push, Pull, Legs, Upper, Lower ou similar, 2 dias descanso)",
    6: "Push/Pull/Legs x2 (segunda a sábado, domingo descanso)",
  };

  const split = splitGuide[data.daysPerWeek] ?? splitGuide[4];

  return `Você é um personal trainer especialista em periodização. Crie um plano semanal de treinos completo para 7 dias (segunda a domingo).

Parâmetros:
- Nível: ${data.level}
- Objetivos: ${data.goals.join(", ")}
- Equipamento: ${data.equipment}
- Dias de treino por semana: ${data.daysPerWeek}
- Split recomendado: ${split}

Retorne APENAS um objeto JSON válido, sem markdown, sem explicações, sem texto antes ou depois. O JSON deve seguir exatamente este formato:

{
  "nome": "nome criativo do plano semanal",
  "descricao": "breve descrição do plano em 1-2 frases",
  "dias": [
    {
      "dia": "Segunda-feira",
      "foco": "nome do foco do treino (ex: Peito e Tríceps, Full Body, Descanso Ativo)",
      "tipo": "Treino",
      "musculosprincipais": ["Peito", "Tríceps"],
      "observacao": "dica específica para este dia em 1 frase"
    },
    {
      "dia": "Terça-feira",
      "foco": "Descanso",
      "tipo": "Rest",
      "musculosprincipais": [],
      "observacao": "Aproveite para alongar e recuperar"
    }
  ],
  "dica_geral": "dica geral importante para seguir o plano com consistência"
}

Regras:
- Inclua exatamente 7 dias (Segunda-feira a Domingo)
- Dias sem treino devem ter tipo: "Rest"
- Dias com treino devem ter tipo: "Treino"
- O número de dias com tipo "Treino" deve ser exatamente ${data.daysPerWeek}
- Distribua os dias de descanso estrategicamente para otimizar a recuperação
- Adapte o volume e intensidade ao nível ${data.level}
- Considere os objetivos: ${data.goals.join(", ")}`;
}

export async function POST(request: NextRequest) {
  const client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
  });

  try {
    const body: WeeklyPlanRequest = await request.json();

    const { level, goals, equipment, daysPerWeek } = body;
    if (!level || !goals?.length || !equipment || !daysPerWeek) {
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
            "Você é um personal trainer especialista em periodização. Sempre responda exclusivamente com JSON válido, sem markdown nem texto adicional.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const raw = completion.choices[0]?.message?.content ?? "";

    // Strip markdown code fences if present
    const stripped = raw.replace(/```(?:json)?\s*/gi, "").replace(/```/g, "").trim();

    const jsonMatch = stripped.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Resposta da IA sem JSON válido:", raw);
      return NextResponse.json(
        { error: "A IA retornou uma resposta inesperada. Tente novamente." },
        { status: 500 }
      );
    }

    const plan: WeeklyPlan = JSON.parse(jsonMatch[0]);

    return NextResponse.json({ plan });
  } catch (error: unknown) {
    console.error("Erro ao gerar plano semanal:", error);

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
