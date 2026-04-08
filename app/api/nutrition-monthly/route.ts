import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { MonthlyNutritionPlan, MonthlyNutritionRequest } from "@/types/nutrition";

function buildMonthlyPrompt(data: MonthlyNutritionRequest): string {
  const { bodyData, level, goals, basePlan, trainingTime } = data;
  const isAdvanced = ["Avançado", "Atleta / Competidor"].includes(level);
  const isCompetitor = level === "Atleta / Competidor";
  const isContestPrep = goals.includes("Contest Prep / Definição");
  const isPowerlifting = goals.includes("Powerlifting");
  const isEmagrecimento = goals.includes("Emagrecimento");
  const isHipertrofia = goals.includes("Hipertrofia");

  // Periodization structure per goal (Renaissance Periodization + Eric Helms)
  let periodizationGuide = "";

  if (isContestPrep) {
    periodizationGuide = `CONTEST PREP — Déficit progressivo com refeeds:
• Semana 1: ${basePlan.meta_calorica}kcal (semana base, déficit inicial controlado)
• Semana 2: ${basePlan.meta_calorica - 100}kcal (déficit levemente maior, proteína +10%)
• Semana 3: ${basePlan.meta_calorica - 200}kcal (déficit alto) + 1 DIA DE REFEED (2x carbs)
• Semana 4: ${basePlan.meta_calorica - 150}kcal (redução leve para não crashar metabolismo)
Refeeds: aumentar carbs 2-2.5x, manter proteína, reduzir gordura ao mínimo`;
  } else if (isEmagrecimento) {
    periodizationGuide = `EMAGRECIMENTO — Déficit progressivo com diet break na semana 3:
• Semana 1: ${basePlan.meta_calorica}kcal (déficit moderado)
• Semana 2: ${basePlan.meta_calorica - 100}kcal (progressão do déficit)
• Semana 3: DIET BREAK — ${basePlan.tdee}kcal (manutenção por 1 semana para restaurar metabolismo e leptina)
• Semana 4: ${basePlan.meta_calorica - 75}kcal (retorno ao déficit, melhor recuperação metabólica)
Baseado em Eric Helms: diet breaks a cada 4-6 semanas de déficit reduzem a adaptação metabólica`;
  } else if (isHipertrofia && isAdvanced) {
    periodizationGuide = `HIPERTROFIA AVANÇADA — Bulk progressivo (Renaissance Periodization):
• Semana 1 (Acumulação): ${basePlan.meta_calorica}kcal — volume alto, surplus base
• Semana 2 (Acumulação+): ${basePlan.meta_calorica + 100}kcal — aumentar carbos pré/pós treino
• Semana 3 (Intensificação): ${basePlan.meta_calorica + 150}kcal — máximo surplus, volume no MAV
• Semana 4 (Realização/Deload): ${basePlan.meta_calorica - 100}kcal — reduzir calorias junto com deload do treino`;
  } else if (isPowerlifting) {
    periodizationGuide = `POWERLIFTING — Suporte calórico por fase:
• Semana 1 (Acumulação): ${basePlan.meta_calorica + 100}kcal — alto volume, carbs altos para recuperação
• Semana 2 (Intensificação): ${basePlan.meta_calorica + 50}kcal — força máxima, manter carbos
• Semana 3 (Pico/Realização): ${basePlan.meta_calorica}kcal — reduzir ligeiramente, foco em recuperação
• Semana 4 (Deload/Meet week): ${basePlan.meta_calorica - 50}kcal + carboidratos pré-competição estratégicos`;
  } else {
    periodizationGuide = `PERIODIZAÇÃO BASE:
• Semana 1: ${basePlan.meta_calorica}kcal — baseline
• Semana 2: ${basePlan.meta_calorica + 50}kcal — leve progressão
• Semana 3: ${basePlan.meta_calorica + 75}kcal — semana de maior volume
• Semana 4: ${basePlan.meta_calorica - 75}kcal — deload nutricional alinhado com deload de treino`;
  }

  return `Você é um nutricionista esportivo certificado (CISSN) especializado em periodização nutricional (Renaissance Periodization, Eric Helms, Layne Norton).

PERFIL:
• Peso: ${bodyData.weight}kg | Altura: ${bodyData.height}cm | Idade: ${bodyData.age} anos | Sexo: ${bodyData.sex === "M" ? "Masculino" : "Feminino"}
• Nível: ${level} | Objetivos: ${goals.join(", ")}
• Horário de treino: ${trainingTime ?? "Variável"}
• TDEE base: ${basePlan.tdee}kcal
• Meta calórica base: ${basePlan.meta_calorica}kcal

${periodizationGuide}

Gere um PLANO NUTRICIONAL MENSAL com 4 semanas detalhadas. Para cada semana:
- Especifique calorias de treino e descanso separadamente (calorie cycling)
- Macros ajustados à fase (mais carbs em semanas de alto volume, mais proteína em déficit)
- Observações técnicas específicas da fase (baseadas em RP/Helms)
- Marque explicitamente semanas de refeed (refeed: true) e deload (deload: true)

Retorne APENAS JSON válido:
{
  "nome": "nome do plano mensal (criativo e técnico)",
  "descricao": "metodologia de periodização aplicada em 1-2 frases",
  "semanas": [
    {
      "semana": 1,
      "nome": "nome da semana (ex: Acumulação Base)",
      "foco": "foco nutricional desta semana",
      "calorias_treino": 2800,
      "calorias_descanso": 2500,
      "proteina": 180,
      "carboidratos": 300,
      "gordura": 80,
      "ajuste_percentual": 0,
      "refeed": false,
      "deload": false,
      "observacao": "instrução técnica específica para esta semana"
    }
  ],
  "progressao_calorica": "como e por que as calorias progridem ao longo das 4 semanas",
  "dica_mensal": "o conselho mais importante para executar este mês com sucesso",
  "fonte": "autores/sistemas que embasaram este plano"
}`;
}

export async function POST(request: NextRequest) {
  const client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
  });

  try {
    const body: MonthlyNutritionRequest = await request.json();
    const { bodyData, level, goals, basePlan } = body;

    if (!bodyData || !level || !goals?.length || !basePlan) {
      return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
    }

    const prompt = buildMonthlyPrompt(body);

    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "Você é um nutricionista esportivo certificado (CISSN) especialista em periodização nutricional. Responda exclusivamente com JSON válido.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.5,
      max_tokens: 2500,
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const stripped = raw.replace(/```(?:json)?\s*/gi, "").replace(/```/g, "").trim();
    const jsonMatch = stripped.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Resposta inesperada. Tente novamente." }, { status: 500 });
    }

    const monthlyPlan: MonthlyNutritionPlan = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ monthlyPlan });
  } catch (error: unknown) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Erro ao processar resposta." }, { status: 500 });
    }
    const message = error instanceof Error ? error.message : "Erro interno.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
