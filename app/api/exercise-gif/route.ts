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

async function fetchWithKey(url: string, apiKey: string) {
  return fetch(url, {
    headers: {
      "X-RapidAPI-Key": apiKey,
      "X-RapidAPI-Host": "exercisedb.p.rapidapi.com",
    },
  });
}

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name");
  if (!name) return NextResponse.json({ gifUrl: null });

  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) return NextResponse.json({ gifUrl: null });

  for (const term of searchTerms(name)) {
    try {
      const res = await fetchWithKey(
        `https://exercisedb.p.rapidapi.com/exercises/name/${encodeURIComponent(term)}?limit=3&offset=0`,
        apiKey
      );
      if (!res.ok) continue;

      const data: ExerciseDBResult[] = await res.json();
      if (!Array.isArray(data) || data.length === 0) continue;

      const exercise = data[0];

      // gifUrl present in response (v1 / some v2 plans)
      if (exercise.gifUrl) {
        return NextResponse.json({ gifUrl: exercise.gifUrl });
      }

      // v2.2: gifUrl removed from list endpoint — fetch by ID to get it
      const detail = await fetchWithKey(
        `https://exercisedb.p.rapidapi.com/exercises/exercise/${exercise.id}`,
        apiKey
      );
      if (detail.ok) {
        const ex: ExerciseDBResult = await detail.json();
        if (ex.gifUrl) return NextResponse.json({ gifUrl: ex.gifUrl });
      }

      // Last resort: construct URL from known CDN pattern
      return NextResponse.json({
        gifUrl: `https://v2.exercisedb.io/image/${exercise.id}`,
      });
    } catch {
      continue;
    }
  }

  return NextResponse.json({ gifUrl: null });
}
