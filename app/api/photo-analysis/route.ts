import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

interface PhotoEntry {
  exerciseName: string;
  photos: string[];
}

export async function POST(request: NextRequest) {
  const client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
  });

  try {
    const body: { entries: PhotoEntry[]; level: string } = await request.json();
    const { entries, level } = body;

    if (!entries?.length) {
      return NextResponse.json({ error: "Nenhuma foto enviada." }, { status: 400 });
    }

    type ContentPart =
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string } };

    const content: ContentPart[] = [];

    for (const entry of entries) {
      content.push({ type: "text", text: `Exercício: ${entry.exerciseName}` });
      for (const photo of entry.photos.slice(0, 2)) {
        content.push({ type: "image_url", image_url: { url: photo } });
      }
    }

    content.push({
      type: "text",
      text: `Você é um personal trainer especialista em biomecânica. Analise as fotos acima de exercícios executados por um aluno de nível ${level}.

Para cada exercício identificado, avalie:
- Postura e alinhamento corporal
- O que está correto na execução
- O que precisa ser corrigido (se houver algo)
- Risco de lesão identificado (se houver)

Responda em português brasileiro. Seja objetivo, construtivo e específico. Se a imagem não mostrar o exercício claramente, diga isso.`,
    });

    const completion = await client.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [{ role: "user", content }],
      temperature: 0.5,
      max_tokens: 1024,
    });

    const analysis = completion.choices[0]?.message?.content ?? "";
    return NextResponse.json({ analysis });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro interno.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
