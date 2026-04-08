import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

export async function POST(req: NextRequest) {
  try {
    const { messages, userProfile } = await req.json();

    const systemPrompt = `Você é um personal trainer e nutricionista especialista. Responda perguntas sobre treino, exercícios, técnica, nutrição e recuperação de forma objetiva e prática em português.${userProfile ? ` O usuário é de nível ${userProfile.level} com objetivo de ${userProfile.goals.join(", ")}.` : ""}`;

    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      max_tokens: 512,
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
