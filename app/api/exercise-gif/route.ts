import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name");
  if (!name) return NextResponse.json({ gifUrl: null });

  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) return NextResponse.json({ gifUrl: null });

  try {
    const res = await fetch(
      `https://exercisedb.p.rapidapi.com/exercises/name/${encodeURIComponent(name.toLowerCase())}?limit=1&offset=0`,
      {
        headers: {
          "X-RapidAPI-Key": apiKey,
          "X-RapidAPI-Host": "exercisedb.p.rapidapi.com",
        },
        next: { revalidate: 86400 },
      }
    );

    if (!res.ok) return NextResponse.json({ gifUrl: null });

    const data = await res.json();
    const gifUrl: string | null = data?.[0]?.gifUrl ?? null;
    return NextResponse.json({ gifUrl });
  } catch {
    return NextResponse.json({ gifUrl: null });
  }
}
