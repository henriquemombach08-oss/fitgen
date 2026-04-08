import { NextRequest, NextResponse } from "next/server";

interface Suggestion {
  value: string;
  data: { base_id: number };
}

function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
}

function scoreMatch(query: string, candidate: string): number {
  const q = normalize(query);
  const c = normalize(candidate);
  if (c === q) return 100;
  const qWords = q.split(/\s+/);
  const cWords = c.split(/\s+/);
  // How many query words appear in candidate
  const hits = qWords.filter((w) => cWords.includes(w)).length;
  // Bonus if candidate starts with query
  const startBonus = c.startsWith(q) ? 20 : 0;
  return (hits / qWords.length) * 60 + startBonus;
}

function bestMatch(name: string, suggestions: Suggestion[]): number | null {
  if (!suggestions.length) return null;
  let best = suggestions[0];
  let bestScore = scoreMatch(name, suggestions[0].value);
  for (let i = 1; i < suggestions.length; i++) {
    const score = scoreMatch(name, suggestions[i].value);
    if (score > bestScore) {
      bestScore = score;
      best = suggestions[i];
    }
  }
  return best.data.base_id;
}

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name");
  if (!name) return NextResponse.json({ images: [] });

  try {
    const searchRes = await fetch(
      `https://wger.de/api/v2/exercise/search/?term=${encodeURIComponent(name)}&language=english&format=json`,
      { next: { revalidate: 86400 } }
    );
    if (!searchRes.ok) return NextResponse.json({ images: [] });

    const searchData = await searchRes.json();
    const suggestions: Suggestion[] = searchData.suggestions ?? [];
    const baseId = bestMatch(name, suggestions);
    if (!baseId) return NextResponse.json({ images: [] });

    const imagesRes = await fetch(
      `https://wger.de/api/v2/exerciseimage/?exercise_base=${baseId}&format=json`,
      { next: { revalidate: 86400 } }
    );
    if (!imagesRes.ok) return NextResponse.json({ images: [] });

    const imagesData = await imagesRes.json();
    const images: string[] = (imagesData.results ?? [])
      .map((img: { image: string }) => img.image)
      .slice(0, 2);

    return NextResponse.json({ images });
  } catch {
    return NextResponse.json({ images: [] });
  }
}
