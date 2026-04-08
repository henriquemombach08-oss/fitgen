import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const EXERCISES_URL =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json";
const IMAGES_BASE =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/images";

interface FreeExercise {
  id: string;
  name: string;
  images: string[];
}

let cachedExercises: FreeExercise[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24h

async function getExercises(): Promise<FreeExercise[]> {
  if (cachedExercises && Date.now() - cacheTime < CACHE_TTL) {
    return cachedExercises;
  }
  const res = await fetch(EXERCISES_URL);
  if (!res.ok) return [];
  const data: FreeExercise[] = await res.json();
  cachedExercises = data;
  cacheTime = Date.now();
  return data;
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
  const hits = qWords.filter((w) => cWords.includes(w)).length;
  const startBonus = c.startsWith(q) ? 20 : 0;
  return (hits / qWords.length) * 60 + startBonus;
}

function findBestMatch(name: string, exercises: FreeExercise[]): FreeExercise | null {
  if (!exercises.length) return null;
  let best: FreeExercise | null = null;
  let bestScore = 0;
  for (const ex of exercises) {
    const score = scoreMatch(name, ex.name);
    if (score > bestScore) {
      bestScore = score;
      best = ex;
    }
  }
  return bestScore >= 20 ? best : null;
}

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name");
  if (!name) return NextResponse.json({ images: [] });

  try {
    const exercises = await getExercises();
    const match = findBestMatch(name, exercises);
    if (!match || !match.images.length) return NextResponse.json({ images: [] });

    const images = match.images
      .slice(0, 2)
      .map((img) => `${IMAGES_BASE}/${img}`);

    return NextResponse.json({ images });
  } catch {
    return NextResponse.json({ images: [] });
  }
}
