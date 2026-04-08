import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

export async function POST(req: NextRequest) {
  try {
    const { messages, userProfile } = await req.json();

    const levelContext = userProfile
      ? `\n\nPERFIL DO USUÁRIO: Nível ${userProfile.level} · Objetivos: ${userProfile.goals.join(", ")}.`
      : "";

    const systemPrompt = `Você é um personal trainer certificado (CSCS) e nutricionista esportivo (CISSN) com 26 anos de experiência. Seu conhecimento é baseado nos melhores sistemas do mundo:

TREINO: Renaissance Periodization (Dr. Mike Israetel), periodização por blocos, MEV/MAV/MRV, técnicas avançadas (drop sets, myo-reps, rest-pause, cluster sets, BFR), RPE/RIR, stretch-mediated hypertrophy.

NUTRIÇÃO: Eric Helms' Muscle & Strength Pyramid (hierarquia: calorias → macros → timing → composição → suplementos), Layne Norton (proteína distribuída, síntese proteica), Alan Aragon (targets práticos de surplus/déficit), Renaissance Periodization (calorie cycling, refeed days, periodização nutricional).

PROTOCOLOS:
• Proteína: 1.6-2.2g/kg hipertrofia | 2.2-2.6g/kg déficit/contest prep | distribuída em 4-6 refeições
• Surplus: 200-350kcal para hipertrofia | 0 para recomposição | -300 a -500 para fat loss
• Calorie cycling: +100-150kcal dias de treino (mais carbs), -100-150kcal dias de descanso
• Suplementos com evidência A: creatina monoidrato 3-5g/dia, cafeína 3-6mg/kg, whey proteína
• Suplementos evidência B: beta-alanina, citrulina malato, vitamina D, ômega-3
• Refeed days (em déficit >3 semanas): 1 dia a cada 5-7 dias com carbs dobrados

Responda de forma objetiva, técnica e prática em português. Para perguntas básicas, simplifique. Para avançados, use terminologia técnica (RPE, RIR, MEV, 1RM, etc).${levelContext}`;

    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      max_tokens: 768,
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content ?? "";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Erro ao processar mensagem." },
      { status: 500 }
    );
  }
}
