import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Try multiple search terms from most to least specific
function searchTerms(name: string): string[] {
  const lower = name.toLowerCase().trim();
  const terms: string[] = [lower];

  // Remove common equipment prefixes to get a broader match
  const stripped = lower
    .replace(/^(barbell|dumbbell|cable|machine|ez-?bar|smith machine|resistance band)\s+/i, "")
    .trim();
  if (stripped !== lower) terms.push(stripped);

  // First two words
  const words = lower.split(/\s+/);
  if (words.length > 2) terms.push(words.slice(0, 2).join(" "));

  // First word only as last resort
  if (words.length > 1) terms.push(words[0]);

  return [...new Set(terms)];
}

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name");
  if (!name) return NextResponse.json({ gifUrl: null });

  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) return NextResponse.json({ gifUrl: null });

  const terms = searchTerms(name);

  for (const term of terms) {
    try {
      const res = await fetch(
        `https://exercisedb.p.rapidapi.com/exercises/name/${encodeURIComponent(term)}?limit=5&offset=0`,
        {
          headers: {
            "X-RapidAPI-Key": apiKey,
            "X-RapidAPI-Host": "exercisedb.p.rapidapi.com",
          },
          next: { revalidate: 86400 },
        }
      );

      if (!res.ok) continue;

      const data = await res.json();
      if (Array.isArray(data) && data.length > 0 && data[0]?.gifUrl) {
        return NextResponse.json({ gifUrl: data[0].gifUrl });
      }
    } catch {
      continue;
    }
  }

  return NextResponse.json({ gifUrl: null });
}
