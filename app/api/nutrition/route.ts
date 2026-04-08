import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { BodyData, NutritionPlan, NutritionRequest } from "@/types/nutrition";

// ─── TDEE Calculation (Mifflin-St Jeor — most validated formula) ─────────────
function calculateBMR(body: BodyData): number {
  const { weight, height, age, sex } = body;
  const base = 10 * weight + 6.25 * height - 5 * age;
  return sex === "M" ? base + 5 : base - 161;
}

const activityMultipliers: Record<string, number> = {
  "Sedentário": 1.2,
  "Levemente ativo": 1.375,
  "Moderadamente ativo": 1.55,
  "Muito ativo": 1.725,
  "Extremamente ativo": 1.9,
};

function calculateTDEE(body: BodyData): number {
  return Math.round(calculateBMR(body) * (activityMultipliers[body.activityLevel] ?? 1.55));
}

// ─── Goal-based caloric adjustment ────────────────────────────────────────────
// Based on: Eric Helms Muscle & Strength Pyramid, Alan Aragon's targets
function getCaloricAdjustment(goals: string[], level: string): number {
  const isAdvanced = ["Avançado", "Atleta / Competidor"].includes(level);
  const isBeginner = level === "Iniciante";

  if (goals.includes("Contest Prep / Definição")) return -500;
  if (goals.includes("Emagrecimento")) return isBeginner ? -400 : -350;
  if (goals.includes("Recomposição Corporal")) return 0;
  if (goals.includes("Resistência")) return 0;
  if (goals.includes("Hipertrofia")) return isAdvanced ? 200 : isBeginner ? 350 : 300;
  if (goals.includes("Força") || goals.includes("Powerlifting")) return isAdvanced ? 250 : 350;
  if (goals.includes("Potência")) return 200;
  return 0;
}

// ─── Macro targets by goal ────────────────────────────────────────────────────
// Sources: RP (Israetel), Helms, Aragon, Norton — protein per kg bodyweight
function getMacroTargets(
  body: BodyData,
  goals: string[],
  level: string,
  targetCalories: number
): { protein: number; fat: number; carbs: number } {
  const w = body.weight;
  const isContestPrep = goals.includes("Contest Prep / Definição");
  const isEmagrecimento = goals.includes("Emagrecimento");
  const isPowerlifting = goals.includes("Powerlifting") || goals.includes("Força");
  const isRecomp = goals.includes("Recomposição Corporal");
  const isAdvanced = ["Avançado", "Atleta / Competidor"].includes(level);

  // Protein: higher in deficit/contest prep to preserve muscle (Helms, Norton)
  let proteinPerKg: number;
  if (isContestPrep) proteinPerKg = isAdvanced ? 2.8 : 2.4;
  else if (isEmagrecimento || isRecomp) proteinPerKg = isAdvanced ? 2.4 : 2.2;
  else if (isPowerlifting) proteinPerKg = 2.0;
  else if (goals.includes("Resistência")) proteinPerKg = 1.6;
  else proteinPerKg = isAdvanced ? 2.2 : 2.0; // hypertrophy

  // Fat: minimum 0.6g/kg for hormonal health (Helms recommends 0.8-1g/kg)
  let fatPerKg: number;
  if (isContestPrep) fatPerKg = 0.7;
  else if (isPowerlifting) fatPerKg = 1.1;
  else fatPerKg = 0.9;

  const protein = Math.round(proteinPerKg * w);
  const fat = Math.round(fatPerKg * w);
  const proteinCals = protein * 4;
  const fatCals = fat * 9;
  const carbCals = Math.max(targetCalories - proteinCals - fatCals, 50 * 4); // min 50g carbs
  const carbs = Math.round(carbCals / 4);

  return { protein, fat, carbs };
}

// ─── Prompt builder ───────────────────────────────────────────────────────────
function buildNutritionPrompt(data: NutritionRequest, tdee: number, targetCals: number, macros: { protein: number; fat: number; carbs: number }): string {
  const { bodyData, level, goals, equipment } = data;
  const isAdvanced = ["Avançado", "Atleta / Competidor"].includes(level);
  const isCompetitor = level === "Atleta / Competidor";
  const isContestPrep = goals.includes("Contest Prep / Definição");
  const isPowerlifting = goals.includes("Powerlifting");
  const deficit = targetCals - tdee;

  // Training day / rest day calorie cycling (RP approach)
  const trainingDayCals = Math.round(targetCals + (isAdvanced ? 150 : 100));
  const restDayCals = Math.round(targetCals - (isAdvanced ? 150 : 100));

  const trainProtein = macros.protein;
  const trainCarbs = Math.round(macros.carbs + (isAdvanced ? 40 : 25));
  const trainFat = macros.fat;
  const restCarbs = Math.max(Math.round(macros.carbs - (isAdvanced ? 40 : 25)), 30);

  const advancedNutritionContext = isAdvanced ? `
CONTEXTO AVANÇADO — RENAISSANCE PERIODIZATION (Dr. Mike Israetel):
• Calorie cycling obrigatório: dias de treino +150kcal (mais carbs pré/pós treino), dias de descanso -150kcal
• Proteína distribuída em 4-6 refeições de ~40-50g cada (Aragon & Schoenfeld — síntese proteica máxima)
• Janela anabólica real: 0-2h pós treino — priorizar proteína de rápida digestão (whey) + carboidratos
• Pré-treino: carbs de digestão lenta 1-2h antes (aveia, arroz integral, batata doce)
• Intra-treino (sessões >75min ou alta intensidade): 30-60g carbs simples (maltodextrina, banana, sports drink)` : "";

  const competitorContext = isCompetitor ? `
CONTEXTO COMPETIDOR — PERIODIZAÇÃO NUTRICIONAL POR BLOCOS:
• Fase Offseason/Acumulação: surplus controlado +200-300kcal, proteína alta, carbs maximizados para desempenho
• Fase Contest Prep/Realização: déficit progressivo, aumentar proteína para preservar músculo, reduzir carbs gradualmente
• Refeed Days (a cada 5-7 dias em déficit): dia de carboidratos altos (~2x os carbs normais, manter proteína, reduzir gordura) para restaurar leptina e performance
• Peak Week: depleção de carboidratos (dias 1-3) → carb loading (dias 4-6) → sodium/water manipulation (dia 7)
${isContestPrep ? "• MODO CONTEST PREP ATIVO: gere protocolo de refeed específico" : ""}` : "";

  const powerliftingContext = isPowerlifting ? `
CONTEXTO POWERLIFTING:
• Carbs são o macronutriente mais importante — combustível direto para levantamentos máximos
• Pré-treino: refeição rica em carbs complexos + proteína 2-3h antes
• Pos-treino: refeição completa com proteína + carbs em 1-2h
• Durante meet/competição: carboidratos simples entre tentativas (gel, banana, gatorade)
• Considere fases de bulk controlado (offseason) e cut para categoria de peso` : "";

  return `Você é um nutricionista esportivo certificado (CISSN) com 26 anos de experiência, especializado em atletas de bodybuilding e powerlifting. Seu conhecimento é baseado em Renaissance Periodization, Eric Helms' Muscle & Strength Pyramid, Layne Norton (biolayne.com) e Alan Aragon's Research Review.

DADOS DO ATLETA:
• Peso: ${bodyData.weight}kg | Altura: ${bodyData.height}cm | Idade: ${bodyData.age} anos | Sexo: ${bodyData.sex === "M" ? "Masculino" : "Feminino"}
• Nível de treino: ${level}
• Objetivos: ${goals.join(", ")}
• Equipamento: ${equipment}
• Nível de atividade: ${bodyData.activityLevel}

CÁLCULO PRÉ-DEFINIDO (Mifflin-St Jeor):
• TDEE: ${tdee} kcal/dia
• Meta calórica: ${targetCals} kcal/dia (${deficit > 0 ? "+" + deficit + " surplus" : deficit + " déficit"})
• Proteína: ${macros.protein}g | Carboidrato: ${macros.carbs}g | Gordura: ${macros.fat}g

CALORIE CYCLING (Renaissance Periodization):
• Dia de treino: ${trainingDayCals} kcal (P: ${trainProtein}g | C: ${trainCarbs}g | G: ${trainFat}g)
• Dia de descanso: ${restDayCals} kcal (P: ${trainProtein}g | C: ${restCarbs}g | G: ${trainFat}g)
${advancedNutritionContext}
${competitorContext}
${powerliftingContext}

INSTRUÇÕES:
1. Gere um plano com ${isCompetitor ? "5-6" : isAdvanced ? "4-5" : "3-4"} refeições por dia
2. Distribua as refeições estrategicamente em torno do treino
3. Para suplementos: inclua APENAS os com evidência científica sólida (Nível A: creatina, cafeína, whey; Nível B: beta-alanina, citrulina, vitamina D; Nível C: BCAAs em déficit calórico)
4. A dica_principal deve ser o conselho mais importante para este perfil específico
5. fonte_metodologica: cite os sistemas/autores que embasaram as recomendações

Retorne APENAS JSON válido, sem markdown:

{
  "tdee": ${tdee},
  "meta_calorica": ${targetCals},
  "surplus_deficit": ${deficit},
  "macros_treino": {
    "calories": ${trainingDayCals},
    "protein": ${trainProtein},
    "carbs": ${trainCarbs},
    "fat": ${trainFat}
  },
  "macros_descanso": {
    "calories": ${restDayCals},
    "protein": ${trainProtein},
    "carbs": ${restCarbs},
    "fat": ${trainFat}
  },
  "refeicoes": [
    {
      "nome": "nome da refeição",
      "horario": "horário ou timing em relação ao treino",
      "calorias": 500,
      "proteina": 40,
      "carboidrato": 50,
      "gordura": 15,
      "exemplos": ["opção 1 com gramas", "opção 2 com gramas"],
      "observacao": "dica técnica específica desta refeição"
    }
  ],
  "suplementos": [
    {
      "nome": "nome do suplemento",
      "dose": "dose exata",
      "timing": "quando tomar",
      "evidencia": "A",
      "objetivo": "objetivo específico",
      "nota": "contexto científico em 1 frase"
    }
  ],
  "periodizacao_nutricional": "descrição técnica de como a nutrição deve ser periodizada junto com o treino",
  ${isContestPrep || isCompetitor ? `"protocolo_refeed": "protocolo detalhado de refeed: quando, quanto, como",` : ""}
  "dica_principal": "o conselho mais importante para este perfil específico",
  "fonte_metodologica": "Renaissance Periodization + Eric Helms + [outros autores aplicados]"
}`;
}

export async function POST(request: NextRequest) {
  const client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
  });

  try {
    const body: NutritionRequest = await request.json();
    const { bodyData, level, goals } = body;

    if (!bodyData?.weight || !bodyData?.height || !bodyData?.age || !bodyData?.sex || !level || !goals?.length) {
      return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
    }

    const tdee = calculateTDEE(bodyData);
    const adjustment = getCaloricAdjustment(goals, level);
    const targetCals = tdee + adjustment;
    const macros = getMacroTargets(bodyData, goals, level, targetCals);

    const prompt = buildNutritionPrompt(body, tdee, targetCals, macros);

    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "Você é um nutricionista esportivo certificado (CISSN). Sempre responda exclusivamente com JSON válido, sem markdown nem texto adicional.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.55,
      max_tokens: 3500,
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const stripped = raw.replace(/```(?:json)?\s*/gi, "").replace(/```/g, "").trim();
    const jsonMatch = stripped.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Nutrition API: no JSON in response:", raw);
      return NextResponse.json({ error: "A IA retornou uma resposta inesperada. Tente novamente." }, { status: 500 });
    }

    const plan: NutritionPlan = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ plan });
  } catch (error: unknown) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Não foi possível processar a resposta. Tente novamente." }, { status: 500 });
    }
    const message = error instanceof Error ? error.message : "Erro interno do servidor.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
