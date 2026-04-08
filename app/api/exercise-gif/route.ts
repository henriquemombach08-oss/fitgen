import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface ExerciseDBResult {
  id: string;
  name: string;
  gifUrl?: string;
}

function searchTerms(name: string): string[] {
  const lower = name.toLowerCase().trim();
  const terms: string[] = [lower];

  const stripped = lower
    .replace(/^(barbell|dumbbell|cable|machine|ez-?bar|smith machine|resistance band)\s+/i, "")
    .trim();
  if (stripped !== lower) terms.push(stripped);

  const words = lower.split(/\s+/);
  if (words.length > 2) terms.push(words.slice(0, 2).join(" "));
  if (words.length > 1) terms.push(words[0]);

  return [...new Set(terms)];
}

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name");
  if (!name) return NextResponse.json({ gifUrl: null });

  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) return NextResponse.json({ gifUrl: null });

  for (const term of searchTerms(name)) {
    try {
      const res = await fetch(
        `https://exercisedb.p.rapidapi.com/exercises/name/${encodeURIComponent(term)}?limit=3&offset=0`,
        {
          headers: {
            "X-RapidAPI-Key": apiKey,
            "X-RapidAPI-Host": "exercisedb.p.rapidapi.com",
          },
          next: { revalidate: 86400 },
        }
      );

      if (!res.ok) continue;

      const data: ExerciseDBResult[] = await res.json();
      if (!Array.isArray(data) || data.length === 0) continue;

      const exercise = data[0];
      // v2.2 removed gifUrl field — construct from id
      const gifUrl = exercise.gifUrl ?? `https://v2.exercisedb.io/image/${exercise.id}`;
      return NextResponse.json({ gifUrl });
    } catch {
      continue;
    }
  }

  return NextResponse.json({ gifUrl: null });
}
