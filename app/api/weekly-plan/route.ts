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
  const isPowerlifting = data.goals.includes("Powerlifting");
  const isContestPrep = data.goals.includes("Contest Prep / Definição");
  const isCompetitor = data.level === "Atleta / Competidor";
  const isBeginner = data.level === "Iniciante";

  // Level-specific split recommendations based on sports science
  function getSplitRecommendation(): string {
    if (isBeginner) {
      return `NÍVEL INICIANTE — Full Body obrigatório:
• Iniciantes devem treinar Full Body independentemente do número de dias
• 3 dias: Full Body Segunda / Full Body Quarta / Full Body Sexta (máximo para iniciantes)
• 4 dias: Full Body x4 com variações (mais volume de repetição para aprendizado motor)
• NÃO use PPL, Bro Split ou Upper/Lower para iniciantes — a frequência por músculo deve ser máxima
• Razão: iniciantes ainda desenvolvem conexão neuromuscular — frequência alta acelera o aprendizado motor
• Exercícios base obrigatórios em todos os dias: squat, hip hinge, press, pull, carry`;
    }

    if (isPowerlifting) {
      return `POWERLIFTING — Periodização específica:
• Squat, Bench Press e Deadlift devem aparecer em dias específicos (não no mesmo dia)
• 3 dias: Squat day / Bench day / Deadlift day (+ acessórios específicos)
• 4 dias: Squat / Bench / Deadlift / Acessórios (Upper ou Lower acessório)
• 5-6 dias: Squat x2 / Bench x2-3 / Deadlift x1-2 — frequência alta para técnica
• Acessórios: good morning, box squat, pause squat (squat), board press, close grip (bench), RDL, deficit deadlift (deadlift)
• RPE-based: compostos a 7-9 RPE, acessórios a 6-8 RPE`;
    }

    if (isContestPrep || (isCompetitor && data.goals.includes("Hipertrofia"))) {
      return `BODYBUILDING / CONTEST PREP — Alta frequência e densidade:
• 3 dias: Push / Pull / Legs (cada grupo 1x/semana — subótimo, considere 4+ dias)
• 4 dias: Upper/Lower x2 ou Push/Pull/Legs/Arms
• 5 dias: Push / Pull / Legs / Upper / Lower ou Bro Split (peito, costas, pernas, ombros, braços)
• 6 dias: PPL x2 (máxima frequência — cada músculo 2x/semana)
• Contest Prep: alta densidade (supersets, giant sets), 45-75s descanso, cardio integrado nos dias de rest
• Inclua dias de "Especialização" para grupos lagging`;
    }

    const splits: Record<string, Record<number, string>> = {
      "Intermediário": {
        3: "Full Body x3 (ainda é eficiente para intermediário inicial) ou Push/Pull/Legs 1x",
        4: "Upper/Lower x2 — cada grupo muscular 2x/semana (ótimo para intermediário)",
        5: "Push/Pull/Legs + Upper + Lower — 5 dias bem distribuídos",
        6: "Push/Pull/Legs x2 — máxima frequência, cada grupo 2x/semana",
      },
      "Avançado": {
        3: "Push/Pull/Legs — volume alto em cada sessão para compensar menor frequência",
        4: "Upper/Lower x2 com volume MAV (12-16 séries/músculo/semana)",
        5: "Push/Pull/Legs + 2 dias Upper/Lower ou Especialização",
        6: "PPL x2 com especialização — semana A e semana B com variações",
      },
      "Atleta / Competidor": {
        3: "Push/Pull/Legs com volume MRV (20+ séries/músculo/semana por sessão)",
        4: "Bro Split adaptado: Peito+Tríceps / Costas+Bíceps / Pernas / Ombros+Core",
        5: "Bro Split completo: Peito / Costas / Pernas / Ombros / Braços",
        6: "PPL x2 ou Bro Split x2 com especialização para músculo lagging",
      },
    };

    const levelSplits = splits[data.level] ?? splits["Intermediário"];
    const days = Math.min(Math.max(data.daysPerWeek, 3), 6);
    return levelSplits[days] ?? levelSplits[4];
  }

  const recoveryRules = `REGRAS OBRIGATÓRIAS DE RECUPERAÇÃO:
• Nunca treinar o mesmo grupo muscular primário em dias consecutivos (mínimo 48h entre sessões do mesmo músculo)
• Exceção: competidores avançados podem treinar o mesmo músculo 2x consecutivos APENAS com volume reduzido no segundo dia
• Nunca colocar Legs em terça e quinta se segunda tem Lower Body (ex: Upper Segunda → Lower Terça → descanso Quarta)
• Distribuir os dias de descanso para separar os grupos mais volumosos (pernas, costas)
• Deadlift e Squat pesados nunca em dias consecutivos — sobrecarga neural`;

  return `Você é um personal trainer certificado (CSCS) e especialista em periodização com 26 anos de experiência.

CRIE UM PLANO SEMANAL COMPLETO DE 7 DIAS para o seguinte perfil:

PERFIL:
• Nível: ${data.level}
• Objetivos: ${data.goals.join(", ")}
• Equipamento: ${data.equipment}
• Dias de treino por semana: ${data.daysPerWeek}

DIVISÃO RECOMENDADA PARA ESTE PERFIL:
${getSplitRecommendation()}

${recoveryRules}

ADAPTAÇÕES POR OBJETIVO:
${data.goals.includes("Emagrecimento") ? "• Emagrecimento: dias de descanso podem ter 'Active Recovery' — caminhada, mobilidade, ou cardio leve" : ""}
${data.goals.includes("Resistência") ? "• Resistência: menor descanso entre sets, circuitos no lugar de treino convencional" : ""}
${data.goals.includes("Força") || data.goals.includes("Powerlifting") ? "• Força/Powerlifting: compostos pesados no início da semana quando energia está alta; segunda e quinta ideais para squat+deadlift" : ""}
${isContestPrep ? "• Contest Prep: inclua cardio nos dias de Rest (LISS 30-45min ou HIIT 20min); densidade alta no treino" : ""}

Retorne APENAS JSON válido, sem markdown, sem texto adicional:

{
  "nome": "nome técnico e motivador do plano",
  "descricao": "descrição técnica do método de periodização em 1-2 frases",
  "dias": [
    {
      "dia": "Segunda-feira",
      "foco": "nome técnico do foco (ex: Push — Peito, Ombros e Tríceps)",
      "tipo": "Treino",
      "musculosprincipais": ["Peito", "Ombros", "Tríceps"],
      "observacao": "dica técnica específica para este dia (volume, intensidade, técnicas recomendadas)"
    },
    {
      "dia": "Terça-feira",
      "foco": "Descanso Ativo",
      "tipo": "Rest",
      "musculosprincipais": [],
      "observacao": "dica de recuperação: alongamento, mobilidade, sono, hidratação"
    }
  ],
  "dica_geral": "conselho técnico sobre como executar este plano com consistência e progressão"
}

OBRIGATÓRIO:
• Exatamente 7 dias (Segunda-feira a Domingo)
• Exatamente ${data.daysPerWeek} dias com tipo "Treino"
• ${7 - data.daysPerWeek} dias com tipo "Rest"
• observacao de cada dia de treino deve mencionar: volume, foco de intensidade ou técnica específica`;
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
            "Você é um personal trainer certificado (CSCS) especialista em periodização. Sempre responda exclusivamente com JSON válido, sem markdown nem texto adicional.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.6,
      max_tokens: 2000,
    });

    const raw = completion.choices[0]?.message?.content ?? "";

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
