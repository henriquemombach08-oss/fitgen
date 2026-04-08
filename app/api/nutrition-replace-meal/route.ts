import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { Meal, ReplaceMealRequest } from "@/types/nutrition";

const dietConstraints: Record<string, string> = {
  "Vegetariano": "Sem carnes ou frutos do mar. Use ovos, laticínios, tofu, tempeh, leguminosas.",
  "Vegano": "Sem nenhum produto animal. Use tofu, tempeh, seitan, lentilha, feijão, proteína vegetal.",
  "Keto / Low-carb": "Máximo 10g de carboidratos nesta refeição. Priorize gorduras e proteínas. Zero grãos ou açúcares.",
  "Paleo": "Apenas alimentos não processados. Sem grãos, leguminosas ou laticínios.",
  "Mediterrâneo": "Preferir peixes, azeite, vegetais, leguminosas e grãos integrais.",
  "Low Carb": "Máximo 25g de carboidratos nesta refeição. Prefira carboidratos de baixo IG.",
};

export async function POST(request: NextRequest) {
  const client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
  });

  try {
    const body: ReplaceMealRequest = await request.json();
    const { meal, mealIndex, plan, goals, level, dietType, trainingTime } = body;

    if (!meal || !plan) {
      return NextResponse.json({ error: "Dados insuficientes." }, { status: 400 });
    }

    const dietNote = dietType && dietType !== "Onívoro"
      ? `\nRESTRIÇÃO ALIMENTAR (${dietType}): ${dietConstraints[dietType] ?? ""}`
      : "";

    const mealContext = mealIndex === 0 ? "primeira refeição do dia (café da manhã)"
      : meal.nome.toLowerCase().includes("pré") ? "refeição pré-treino"
      : meal.nome.toLowerCase().includes("pós") ? "refeição pós-treino"
      : meal.nome.toLowerCase().includes("ceia") ? "ceia noturna (proteína de lenta digestão)"
      : `refeição ${mealIndex + 1} do dia`;

    const prompt = `Você é um nutricionista esportivo (CISSN). Substitua a refeição abaixo por uma alternativa DIFERENTE, mantendo os mesmos macros e calorias.

CONTEXTO DO ATLETA:
• Objetivo: ${goals.join(", ")}
• Nível: ${level}
• Horário de treino: ${trainingTime ?? "não informado"}
• Meta calórica diária: ${plan.meta_calorica} kcal
• Proteína alvo: ${plan.macros_treino.protein}g/dia${dietNote}

REFEIÇÃO A SUBSTITUIR (${mealContext}):
• Nome: ${meal.nome}
• Horário: ${meal.horario}
• Calorias: ${meal.calorias} kcal
• Macros: P ${meal.proteina}g | C ${meal.carboidrato}g | G ${meal.gordura}g
• Opções atuais: ${meal.exemplos.join(", ")}

INSTRUÇÕES:
1. Mantenha o mesmo nome, horário e macros (±5% tolerância)
2. Gere opções alimentares COMPLETAMENTE DIFERENTES das atuais
3. Mantenha a adequação ao objetivo e restrições dietéticas
4. A observação deve conter uma dica técnica relevante para este horário

Retorne APENAS JSON válido, sem markdown:
{
  "nome": "${meal.nome}",
  "horario": "${meal.horario}",
  "calorias": ${meal.calorias},
  "proteina": ${meal.proteina},
  "carboidrato": ${meal.carboidrato},
  "gordura": ${meal.gordura},
  "exemplos": ["opção 1 com gramas", "opção 2 com gramas", "opção 3 com gramas"],
  "observacao": "dica técnica específica"
}`;

    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "Você é um nutricionista esportivo certificado. Responda exclusivamente com JSON válido, sem markdown nem texto adicional.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.75,
      max_tokens: 600,
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const stripped = raw.replace(/```(?:json)?\s*/gi, "").replace(/```/g, "").trim();
    const jsonMatch = stripped.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Resposta inesperada da IA. Tente novamente." }, { status: 500 });
    }

    const newMeal: Meal = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ meal: newMeal });
  } catch (error: unknown) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Erro ao processar resposta. Tente novamente." }, { status: 500 });
    }
    const message = error instanceof Error ? error.message : "Erro interno do servidor.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
